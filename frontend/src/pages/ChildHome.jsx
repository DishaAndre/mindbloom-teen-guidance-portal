import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = ['School Problems','Friendship Issues','Family Issues','Online Safety','Bullying','Mental Feelings','Other']

const STATUS_CFG = {
  'Submitted':             { cls: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-400' },
  'Under Review':          { cls: 'bg-blue-50 text-blue-700 border border-blue-200',      dot: 'bg-blue-400' },
  'Assigned to Counselor': { cls: 'bg-violet-50 text-violet-700 border border-violet-200',dot: 'bg-violet-400' },
  'Answered':              { cls: 'bg-teal-50 text-teal-700 border border-teal-200',      dot: 'bg-teal-500' },
}

const STEPS = ['Submitted','Under Review','Assigned to Counselor','Answered']

/* ── Shared shell ─────────────────────────────────────────────────────────── */
function Shell({ user, logout, tab, setTab, children }) {
  const TABS = [
    { k:'home',       label:'Home' },
    { k:'ask',        label:'Ask a Question' },
    { k:'questions',  label:'My Questions' },
    { k:'learn',      label:'Learn' },
    { k:'quiz',       label:'Quiz' },
  ]
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f6]">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 w-5 h-5">
                <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5c0 2.5 1.2 4.7 3.1 6.1L12 19l3.4-2.4c1.9-1.4 3.1-3.6 3.1-6.1C18.5 6.5 15.5 3 12 3z" fill="white" opacity=".9"/>
                <circle cx="12" cy="10.5" r="2.5" fill="white" opacity=".5"/>
              </svg>
            </div>
            <span className="font-display font-medium text-stone-800 text-lg">MindBloom</span>
          </div>
          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {TABS.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  tab === t.k
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}>{t.label}</button>
            ))}
          </nav>
          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-700 text-sm font-bold">{user.name.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-stone-700">{user.name}</span>
            </div>
            <button onClick={logout} className="btn-ghost btn-sm text-stone-400 hover:text-stone-600">Sign out</button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                tab === t.k ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-100'
              }`}>{t.label}</button>
          ))}
        </div>
      </header>
      <main className="flex-1 w-full px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        {children}
      </main>
    </div>
  )
}

/* ── Home tab ─────────────────────────────────────────────────────────────── */
function HomeTab({ user, questions, setTab }) {
  const answered = questions.filter(q => q.status === 'Answered').length
  const pending  = questions.filter(q => q.status !== 'Answered').length
  const hasUrgent = questions.some(q => q.isUrgent && q.status !== 'Answered')

  return (
    <div className="fade">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-8 mb-6">
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-teal-500/30 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-20 bottom-0 w-48 h-48 rounded-full bg-teal-700/40 translate-y-1/3" />
        <div className="relative z-10">
          <p className="text-teal-200 text-sm font-medium mb-1">Good to see you</p>
          <h1 className="font-display text-4xl text-white mb-2">Hello, {user.name}.</h1>
          <p className="text-teal-100/80 mb-6 max-w-md">This is your safe space. Whatever is on your mind, we are here to listen and help.</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: questions.length.toString(), sub: 'Questions asked' },
              { label: answered.toString(),          sub: 'Answered' },
              { label: pending.toString(),           sub: 'Awaiting reply' },
            ].map(s => (
              <div key={s.sub} className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 min-w-[90px]">
                <p className="font-display text-2xl text-white">{s.label}</p>
                <p className="text-teal-200 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent alert */}
      {hasUrgent && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">You have an urgent question awaiting a response.</p>
            <button onClick={() => setTab('questions')} className="text-xs text-amber-600 hover:underline mt-0.5">View questions →</button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { tab:'ask',       title:'Ask a question',  desc:'Write anything on your mind',    bg:'bg-teal-600',    icon: <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/> },
          { tab:'learn',     title:'Read articles',   desc:'Learn and grow',                 bg:'bg-indigo-500',  icon: <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/> },
          { tab:'quiz',      title:'Take a quiz',     desc:'Test your knowledge',             bg:'bg-amber-500',   icon: <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/> },
          { tab:'questions', title:'My questions',    desc:'Track your conversations',       bg:'bg-violet-500',  icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/> },
        ].map(a => (
          <button key={a.tab} onClick={() => setTab(a.tab)}
            className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5 bg-white border border-stone-100">
            <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">{a.icon}</svg>
            </div>
            <p className="font-semibold text-stone-800 text-sm">{a.title}</p>
            <p className="text-xs text-stone-400 mt-0.5">{a.desc}</p>
            <svg className="w-4 h-4 text-stone-300 absolute right-4 top-4 group-hover:text-stone-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
      </div>

      {/* Recent questions + Achievements side by side on large screens */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-stone-800">Recent questions</h2>
            <button onClick={() => setTab('questions')} className="text-xs text-teal-600 font-semibold hover:underline">See all →</button>
          </div>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm">No questions yet. Ask your first question!</p>
              <button onClick={() => setTab('ask')} className="btn-main btn-sm mt-3">Ask now</button>
            </div>
          ) : (
            <div className="space-y-1">
              {questions.slice(0,4).map(q => {
                const s = STATUS_CFG[q.status] || { cls:'bg-stone-100 text-stone-500', dot:'bg-stone-400' }
                return (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors group">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate group-hover:text-teal-700 transition-colors">{q.title}</p>
                      <p className="text-xs text-stone-400">{q.category}</p>
                    </div>
                    <span className={`badge text-xs shrink-0 ${s.cls}`}>{q.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-display text-lg text-stone-800 mb-4">Achievements</h2>
          {user.badges?.length > 0 ? (
            <div className="space-y-2">
              {user.badges.map(b => (
                <div key={b} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                  <p className="text-sm font-medium text-stone-700">{b === 'first_question' ? 'First Question' : b.replace(/_/g,' ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-4">Ask your first question to earn a badge.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Ask tab ──────────────────────────────────────────────────────────────── */
function AskTab({ userId, userName, onAsked }) {
  const [form, setForm] = useState({ title:'', content:'', category:'', isPrivate:false, isUrgent:false })
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')
  const [done, setDone] = useState(false)

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await axios.post('/api/questions', { ...form, userId, userName }); setDone(true); onAsked() }
    catch(e) { setErr(e.response?.data?.error || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  if (done) return (
    <div className="fade max-w-lg mx-auto text-center py-20">
      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 className="font-display text-3xl text-stone-800 mb-3">Question submitted</h2>
      <p className="text-stone-500 mb-8 leading-relaxed">A counselor will read and reply to your question soon. You were brave for reaching out.</p>
      <button onClick={() => { setDone(false); setForm({ title:'', content:'', category:'', isPrivate:false, isUrgent:false }) }}
        className="btn-main">Ask another question</button>
    </div>
  )

  return (
    <div className="fade max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-3xl text-stone-800">Ask a question</h2>
        <p className="text-stone-500 mt-1">Whatever is on your mind — this is private and safe.</p>
      </div>
      <div className="card shadow-sm">
        {err && <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">{err}</div>}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label">What is your question about?</label>
            <input className="input" placeholder="Give your question a brief, clear title"
              value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} maxLength={120} required />
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button type="button" key={c} onClick={() => setForm(p=>({...p,category:c}))}
                  className={`text-sm py-2.5 px-3 rounded-xl border text-left font-medium transition-all ${
                    form.category === c ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tell us more</label>
            <textarea className="input resize-none leading-relaxed" rows={6}
              placeholder="Describe what is happening and how it makes you feel. The more detail you share, the better advice you will receive."
              value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} maxLength={1000} required />
            <p className="text-xs text-stone-400 mt-1.5 text-right">{form.content.length} / 1000</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {[{ k:'isPrivate', label:'Keep private', desc:'Only your counselor can see this' },
              { k:'isUrgent',  label:'This is urgent', desc:'I need help as soon as possible' }
            ].map(opt => (
              <button type="button" key={opt.k} onClick={() => setForm(p=>({...p,[opt.k]:!p[opt.k]}))}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all flex-1 min-w-[180px] ${
                  form[opt.k] ? 'border-teal-400 bg-teal-50' : 'border-stone-200 bg-white hover:border-stone-300'
                }`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${form[opt.k]?'bg-teal-600 border-teal-600':'border-stone-300'}`}>
                  {form[opt.k] && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${form[opt.k]?'text-teal-700':'text-stone-700'}`}>{opt.label}</p>
                  <p className="text-xs text-stone-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button type="submit" className="btn-main w-full py-3" disabled={busy || !form.category}>
            {busy ? 'Submitting…' : 'Submit question'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Questions tab ────────────────────────────────────────────────────────── */
function QuestionsTab({ questions, loading, setTab }) {
  const [open, setOpen] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? questions : questions.filter(q => q.status === filter)

  if (loading) return <div className="space-y-3 fade">{[1,2,3].map(i=><div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-stone-100"/>)}</div>
  return (
    <div className="fade">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-3xl text-stone-800">My Questions</h2>
        <button onClick={() => setTab('ask')} className="btn-main btn-sm">+ New question</button>
      </div>
      {/* Status filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all','Submitted','Under Review','Assigned to Counselor','Answered'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all ${
              filter===f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
            }`}>{f === 'all' ? 'All' : f} {f === 'all' ? `(${questions.length})` : `(${questions.filter(q=>q.status===f).length})`}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12"><p className="text-stone-400 text-sm">No questions here yet.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const s = STATUS_CFG[q.status] || { cls:'bg-stone-100 text-stone-500', dot:'bg-stone-400' }
            const isOpen = open === q.id
            return (
              <div key={q.id} className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-teal-200 shadow-sm' : 'border-stone-100 hover:border-stone-200'}`}>
                <button className="w-full p-5 text-left" onClick={() => setOpen(isOpen ? null : q.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm leading-snug">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md">{q.category}</span>
                          {q.isUrgent  && <span className="badge bg-amber-50 text-amber-600 border border-amber-200 text-xs">Urgent</span>}
                          {q.isPrivate && <span className="badge bg-stone-100 text-stone-500 text-xs">Private</span>}
                          {q.reply     && <span className="badge bg-teal-50 text-teal-600 text-xs">Replied</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge text-xs ${s.cls}`}>{q.status}</span>
                      <svg className={`w-4 h-4 text-stone-400 transition-transform ${isOpen?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-stone-50 pt-4 space-y-4 fade-in">
                    {/* Timeline */}
                    <div>
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-3">Progress</p>
                      <div className="flex items-center gap-1">
                        {STEPS.map((s2, i) => {
                          const cur = STEPS.indexOf(q.status)
                          const done = i <= cur
                          return (
                            <React.Fragment key={s2}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                                done ? (i===cur ? 'bg-teal-600 text-white ring-4 ring-teal-100' : 'bg-teal-500 text-white') : 'bg-stone-100 text-stone-400'
                              }`}>
                                {i < cur
                                  ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                  : i+1}
                              </div>
                              {i < STEPS.length-1 && <div className={`flex-1 h-0.5 rounded-full ${i<cur?'bg-teal-400':'bg-stone-100'}`}/>}
                            </React.Fragment>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {STEPS.map(s2=><span key={s2} className="text-[10px] text-stone-400 flex-1 first:text-left last:text-right text-center leading-tight">{s2.split(' ')[0]}</span>)}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 leading-relaxed">{q.content}</div>
                    {/* Reply */}
                    {q.reply ? (
                      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-teal-700 mb-2">Reply from {q.counselorName}</p>
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{q.reply}</p>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-xs text-stone-400">{q.isUrgent ? 'Marked urgent — counselor will prioritise your question.' : 'A counselor will reply soon. Thank you for your patience.'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Learn tab ────────────────────────────────────────────────────────────── */
function LearnTab() {
  const [articles, setArticles] = useState([])
  const [open, setOpen]         = useState(null)
  const [loading, setLoading]   = useState(true)
  useEffect(() => { axios.get('/api/articles?approved=true').then(r=>setArticles(r.data)).finally(()=>setLoading(false)) }, [])

  const CAT_COLORS = {
    Friendship:'bg-blue-100 text-blue-700', 'Online Safety':'bg-violet-100 text-violet-700',
    School:'bg-amber-100 text-amber-700', 'Mental Health':'bg-teal-100 text-teal-700',
    Bullying:'bg-red-100 text-red-700', Family:'bg-orange-100 text-orange-700',
  }

  if (loading) return <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-stone-100"/>)}</div>
  return (
    <div className="fade">
      <div className="mb-6">
        <h2 className="font-display text-3xl text-stone-800">Learn</h2>
        <p className="text-stone-500 mt-1">Articles written by your counselors to help you understand and grow.</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {articles.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border border-stone-100 overflow-hidden transition-all hover:shadow-md ${open===a.id?'ring-2 ring-teal-300':''}`}>
            <button className="w-full p-5 text-left" onClick={() => setOpen(open===a.id?null:a.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className={`badge text-xs mb-2 ${CAT_COLORS[a.category]||'bg-stone-100 text-stone-600'}`}>{a.category}</span>
                  <p className="font-semibold text-stone-800 text-sm leading-snug">{a.title}</p>
                  <p className="text-xs text-stone-400 mt-1">{a.authorName}</p>
                </div>
                <svg className={`w-5 h-5 text-stone-300 shrink-0 mt-0.5 transition-transform ${open===a.id?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </div>
            </button>
            {open === a.id && (
              <div className="px-5 pb-5 border-t border-stone-50 pt-4 fade-in">
                <p className="text-sm text-stone-500 leading-relaxed mb-4">{a.summary}</p>
                <ol className="space-y-2.5">
                  {a.tips.map((tip,i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-stone-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
        {articles.length === 0 && <div className="card text-center py-12 col-span-full"><p className="text-stone-400 text-sm">No articles available yet.</p></div>}
      </div>
    </div>
  )
}

/* ── Quiz tab ─────────────────────────────────────────────────────────────── */
function QuizTab() {
  const [quizzes,setQuizzes]=useState([])
  const [active,setActive]=useState(null)
  const [qi,setQi]=useState(0)
  const [sel,setSel]=useState(null)
  const [answers,setAnswers]=useState([])
  const [done,setDone]=useState(false)
  useEffect(()=>{axios.get('/api/quizzes').then(r=>setQuizzes(r.data))},[])

  const start=q=>{setActive(q);setQi(0);setSel(null);setAnswers([]);setDone(false)}
  const pick=i=>{if(sel!==null)return;setSel(i)}
  const next=()=>{
    const upd=[...answers,{sel,correct:active.questions[qi].correct,ok:sel===active.questions[qi].correct}]
    setAnswers(upd)
    if(qi+1<active.questions.length){setQi(i=>i+1);setSel(null)}else setDone(true)
  }
  const score=answers.filter(a=>a.ok).length
  const total=active?.questions.length??0

  if(!active) return (
    <div className="fade">
      <div className="mb-6">
        <h2 className="font-display text-3xl text-stone-800">Quizzes</h2>
        <p className="text-stone-500 mt-1">Test your knowledge and learn along the way.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {quizzes.map(q=>(
          <div key={q.id} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800">{q.title}</p>
              <p className="text-xs text-stone-400 mt-0.5">{q.questions.length} questions</p>
            </div>
            <button onClick={()=>start(q)} className="btn-main btn-sm">Start</button>
          </div>
        ))}
      </div>
    </div>
  )

  if(done){
    const pct=Math.round((score/total)*100)
    return (
      <div className="fade max-w-lg mx-auto">
        <div className="card text-center py-10 mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${pct>=70?'bg-teal-100':'bg-amber-100'}`}>
            <span className={`font-display text-3xl ${pct>=70?'text-teal-700':'text-amber-700'}`}>{pct}%</span>
          </div>
          <h2 className="font-display text-2xl text-stone-800 mb-1">{pct===100?'Perfect score!':pct>=70?'Well done!':'Keep practising!'}</h2>
          <p className="text-stone-500 text-sm">{score} out of {total} correct</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={()=>start(active)} className="btn-main">Try again</button>
            <button onClick={()=>setActive(null)} className="btn-soft">All quizzes</button>
          </div>
        </div>
        <div className="space-y-2">
          {active.questions.map((q,i)=>(
            <div key={i} className={`flex items-center gap-3 text-sm p-3 rounded-xl ${answers[i]?.ok?'bg-teal-50 border border-teal-100 text-teal-700':'bg-red-50 border border-red-100 text-red-600'}`}>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                {answers[i]?.ok
                  ?<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  :<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>}
              </svg>
              <span className="truncate">{q.q}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const q=active.questions[qi]
  return (
    <div className="fade max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-semibold text-stone-700">{active.title}</p>
          <p className="text-xs text-stone-400">Question {qi+1} of {total}</p>
        </div>
        <button onClick={()=>setActive(null)} className="btn-ghost btn-sm">Exit</button>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-1.5 mb-6">
        <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{width:`${(qi/total)*100}%`}}/>
      </div>
      <div className="card">
        <p className="font-display text-xl text-stone-800 leading-snug mb-6">{q.q}</p>
        <div className="space-y-2.5 mb-5">
          {q.options.map((opt,i)=>{
            const isCorrect=i===q.correct, isSel=i===sel
            let cls='border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            if(sel!==null){
              if(isCorrect) cls='border-teal-400 bg-teal-50 text-teal-800 font-medium'
              else if(isSel) cls='border-red-300 bg-red-50 text-red-700'
              else cls='border-stone-100 bg-stone-50 text-stone-400 opacity-60'
            }
            return (
              <button key={i} onClick={()=>pick(i)} className={`w-full text-left text-sm px-4 py-3.5 rounded-xl border transition-all ${cls} ${sel===null?'cursor-pointer':'cursor-default'}`}>
                <span className="text-xs font-semibold text-stone-400 mr-2">{['A','B','C','D'][i]}.</span>{opt}
              </button>
            )
          })}
        </div>
        {sel!==null && (
          <>
            <div className={`rounded-xl p-4 text-sm leading-relaxed mb-4 ${sel===q.correct?'bg-teal-50 border border-teal-100 text-teal-800':'bg-amber-50 border border-amber-100 text-amber-800'}`}>
              <span className="font-semibold">{sel===q.correct?'Correct. ':'Not quite. '}</span>{q.explanation}
            </div>
            <div className="flex justify-end">
              <button onClick={next} className="btn-main">{qi+1<total?'Next question':'See results'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function ChildHome() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('home')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    axios.get(`/api/questions?userId=${user.id}`)
      .then(r => setQuestions(r.data))
      .finally(() => setLoading(false))
  }, [user.id])

  useEffect(() => { load() }, [load])
  const handleLogout = () => { logout(); nav('/login') }

  return (
    <Shell user={user} logout={handleLogout} tab={tab} setTab={setTab}>
      {tab==='home'      && <HomeTab user={user} questions={questions} setTab={setTab}/>}
      {tab==='ask'       && <AskTab userId={user.id} userName={user.name} onAsked={()=>{load();setTab('questions')}}/>}
      {tab==='questions' && <QuestionsTab questions={questions} loading={loading} setTab={setTab}/>}
      {tab==='learn'     && <LearnTab/>}
      {tab==='quiz'      && <QuizTab/>}
    </Shell>
  )
}
