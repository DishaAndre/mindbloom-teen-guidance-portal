const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = 5000;
const DB       = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const read  = () => JSON.parse(fs.readFileSync(DB, 'utf-8'));
const write = d  => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db   = read();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Incorrect username or password.' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.post('/api/register', (req, res) => {
  const { username, password, name, age } = req.body;
  if (!username || !password || !name || !age)
    return res.status(400).json({ error: 'All fields are required.' });
  const n = parseInt(age);
  if (n < 10 || n > 13)
    return res.status(400).json({ error: 'MindBloom is for children aged 10 to 13.' });

  const db = read();
  if (db.users.find(u => u.username === username))
    return res.status(409).json({ error: 'That username is already taken.' });

  const user = { id: 'u' + Date.now(), username, password, role: 'child', name, age: n, badges: [] };
  db.users.push(user);
  write(db);
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

// ── QUESTIONS ─────────────────────────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { userId, counselorId } = req.query;
  let qs = read().questions;
  if (userId)     qs = qs.filter(q => q.userId === userId);
  if (counselorId) qs = qs.filter(q => q.assignedTo === counselorId);
  res.json(qs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/questions', (req, res) => {
  const { userId, userName, title, content, category, isPrivate, isUrgent } = req.body;
  if (!title?.trim() || !content?.trim() || !category)
    return res.status(400).json({ error: 'Title, content and category are required.' });

  const db = read();
  const q  = {
    id: 'q' + Date.now(), userId, userName,
    title: title.trim(), content: content.trim(), category,
    isPrivate: !!isPrivate, isUrgent: !!isUrgent,
    status: 'Submitted', assignedTo: null, counselorName: null,
    reply: null, isFlagged: false,
    createdAt: new Date().toISOString(), answeredAt: null
  };
  db.questions.push(q);

  // first_question badge
  const u = db.users.find(u => u.id === userId);
  if (u && !u.badges.includes('first_question')) u.badges.push('first_question');

  write(db);
  res.status(201).json(q);
});

app.put('/api/questions/:id/assign', (req, res) => {
  const { counselorId } = req.body;
  const db = read();
  const q  = db.questions.find(q => q.id === req.params.id);
  const c  = db.users.find(u => u.id === counselorId);
  if (!q || !c) return res.status(404).json({ error: 'Not found.' });
  q.assignedTo = counselorId; q.counselorName = c.name; q.status = 'Assigned to Counselor';
  write(db); res.json(q);
});

app.put('/api/questions/:id/status', (req, res) => {
  const db = read();
  const q  = db.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found.' });
  q.status = req.body.status;
  write(db); res.json(q);
});

app.put('/api/questions/:id/reply', (req, res) => {
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ error: 'Reply cannot be empty.' });
  const db = read();
  const q  = db.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found.' });
  q.reply = reply.trim(); q.status = 'Answered'; q.answeredAt = new Date().toISOString();
  write(db); res.json(q);
});

app.put('/api/questions/:id/flag', (req, res) => {
  const db = read();
  const q  = db.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found.' });
  q.isFlagged = !q.isFlagged;
  write(db); res.json(q);
});

app.delete('/api/questions/:id', (req, res) => {
  const db = read();
  db.questions = db.questions.filter(q => q.id !== req.params.id);
  write(db); res.json({ ok: true });
});

// ── ARTICLES ──────────────────────────────────────────────────────────────────
app.get('/api/articles', (req, res) => {
  const db = read();
  const approved = req.query.approved === 'true';
  res.json(approved ? db.articles.filter(a => a.approved) : db.articles);
});

app.put('/api/articles/:id/approve', (req, res) => {
  const db = read();
  const a  = db.articles.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found.' });
  a.approved = true; write(db); res.json(a);
});

app.delete('/api/articles/:id', (req, res) => {
  const db = read();
  db.articles = db.articles.filter(a => a.id !== req.params.id);
  write(db); res.json({ ok: true });
});

// ── QUIZZES / USERS / STATS ───────────────────────────────────────────────────
app.get('/api/quizzes', (req, res) => res.json(read().quizzes));

app.get('/api/users',   (req, res) => res.json(read().users.map(({ password: _, ...u }) => u)));

app.delete('/api/users/:id', (req, res) => {
  const db = read();
  db.users = db.users.filter(u => u.id !== req.params.id);
  write(db); res.json({ ok: true });
});

app.get('/api/stats', (req, res) => {
  const db = read();
  const qs = db.questions;
  res.json({
    children:   db.users.filter(u => u.role === 'child').length,
    counselors: db.users.filter(u => u.role === 'counselor').length,
    total:      qs.length,
    answered:   qs.filter(q => q.status === 'Answered').length,
    pending:    qs.filter(q => q.status !== 'Answered').length,
    urgent:     qs.filter(q => q.isUrgent && q.status !== 'Answered').length,
    flagged:    qs.filter(q => q.isFlagged).length,
    articles:   db.articles.filter(a => a.approved).length,
    pendingArticles: db.articles.filter(a => !a.approved).length,
  });
});

app.listen(PORT, () => console.log(`\nMindBloom API → http://localhost:${PORT}\n`));
