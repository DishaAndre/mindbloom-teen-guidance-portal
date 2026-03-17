import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const STATUS_CFG = {
  'Submitted':             { cls:'bg-amber-50 text-amber-700 border border-amber-200',   dot:'bg-amber-400' },
  'Under Review':          { cls:'bg-blue-50 text-blue-700 border border-blue-200',      dot:'bg-blue-400' },
  'Assigned to Counselor': { cls:'bg-violet-50 text-violet-700 border border-violet-200',dot:'bg-violet-400' },
  'Answered':              { cls:'bg-teal-50 text-teal-700 border border-teal-200',      dot:'bg-teal-500' },
}

const TEMPLATES = [
  { label:'Warm opener',    text:'Thank you for trusting us with this. It takes courage to reach out, and what you are feeling is completely valid.\n\n' },
  { label:'Validation',     text:'What you are going through sounds genuinely difficult. Many young people your age face similar situations and you are not alone.\n\n' },
  { label:'Practical help', text:'Here are a few things that may help:\n\n1. \n2. \n3. \n\n' },
  { label:'Closing',        text:'\n\nYou can always come back here if you need more support. You were brave for asking for help.' },
]

const FILTERS = [
  { k:'all',      label:'All' },
  { k:'new',      label:'New' },
  { k:'urgent',   label:'Urgent' },
  { k:'answered', label:'Answered' },
]

const ARTICLE_CATS = ['Friendship','Online Safety','School','Mental Health','Bullying','Family','Other']

function Shell({ user, logout, tab, setTab, children }) {
  const TABS = [
    { k:'questions', label:'Questions' },
    { k:'articles',  label:'Write Article' },
  ]
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f6]">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5c0 2.5 1.2 4.7 3.1 6.1L12 19l3.4-2.4c1.9-1.4 3.1-3.6 3.1-6.1C18.5 6.5 15.5 3 12 3z" fill="white" opacity=".9"/>
                  <circle cx="12" cy="10.5" r="2.5" fill="white" opacity=".5"/>
                </svg>
              </div>
              <span className="font-display font-medium text-stone-800 text-lg">MindBloom</span>
            </div>
            <span className="badge bg-teal-50 text-teal-700 border border-teal-200 text-xs">Counselor</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab===t.k ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}>{t.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-700 text-sm font-bold">{user.name.charAt(0)}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-stone-700 leading-none">{user.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{user.specialization}</p>
              </div>
            </div>
            <button onClick={logout} className="btn-ghost btn-sm text-stone-400">Sign out</button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 px-4 pb-2">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${tab===t.k?'bg-teal-600 text-white':'text-stone-500 hover:bg-stone-100'}`}>{t.label}</button>
          ))}
        </div>
      </header>
      <main className="flex-1 w-full px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">{children}</main>
    </div>
  )
}

/* ── Questions tab ─────────────────────────────────────────────────────────── */
function QuestionsTab({ user }) {
  const [questions, setQuestions] = useState([])
  const [selected,  setSelected]  = useState(null)
  const [reply,     setReply]     = useState('')
  const [filter,    setFilter]    = useState('all')
  const [busy,      setBusy]      = useState(false)
  const [toast,     setToast]     = useState(null)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(() => {
    axios.get(`/api/questions?counselorId=${user.id}`)
      .then(r => setQuestions(r.data)).finally(() => setLoading(false))
  }, [user.id])
  useEffect(() => { load() }, [load])

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const filtered = questions.filter(q => {
    if (filter==='new')      return q.status==='Assigned to Counselor'
    if (filter==='urgent')   return q.isUrgent && q.status!=='Answered'
    if (filter==='answered') return q.status==='Answered'
    return true
  })

  const filterCount = k => k==='all' ? questions.length
    : k==='new'      ? questions.filter(q=>q.status==='Assigned to Counselor').length
    : k==='urgent'   ? questions.filter(q=>q.isUrgent&&q.status!=='Answered').length
    : questions.filter(q=>q.status==='Answered').length

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setBusy(true)
    try {
      const { data } = await axios.put(`/api/questions/${selected.id}/reply`, { reply })
      showToast('Reply sent.')
      setReply(''); setSelected(data); load()
    } catch { showToast('Failed to send reply.', false) }
    finally { setBusy(false) }
  }

  const toggleFlag = async () => {
    if (!selected) return
    const { data } = await axios.put(`/api/questions/${selected.id}/flag`)
    showToast(data.isFlagged ? 'Flagged for admin.' : 'Flag removed.')
    setSelected(data); load()
  }

  const urgent  = questions.filter(q=>q.isUrgent&&q.status!=='Answered').length
  const pending = questions.filter(q=>q.status!=='Answered').length
  const done    = questions.filter(q=>q.status==='Answered').length

  return (
    <div className="fade">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-lift text-sm font-semibold transition-all ${toast.ok?'bg-stone-800 text-white':'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Assigned', val:questions.length,    bg:'bg-stone-50 border-stone-200' },
          { label:'Pending',  val:pending,             bg:'bg-blue-50 border-blue-200' },
          { label:'Urgent',   val:urgent,  warn:urgent>0, bg:urgent>0?'bg-amber-50 border-amber-200':'bg-stone-50 border-stone-200' },
          { label:'Answered', val:done,                bg:'bg-teal-50 border-teal-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`font-display text-3xl ${s.warn?'text-amber-700':'text-stone-800'}`}>{s.val}</p>
            <p className={`text-xs font-medium mt-1 ${s.warn?'text-amber-600':'text-stone-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5 flex-col xl:flex-row">
        {/* Question list */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit mb-4">
            {FILTERS.map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className={`text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all ${filter===f.k?'bg-white text-teal-700 shadow-sm':'text-stone-500 hover:text-stone-700'}`}>
                {f.label} <span className="text-xs opacity-60 ml-0.5">{filterCount(f.k)}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-stone-100"/>)}</div>
          ) : filtered.length===0 ? (
            <div className="card text-center py-12"><p className="text-stone-400 text-sm">No questions here.</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(q => {
                const s = STATUS_CFG[q.status] || {}
                return (
                  <button key={q.id} onClick={()=>{setSelected(q);setReply('')}}
                    className={`w-full bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${
                      selected?.id===q.id?'ring-2 ring-teal-400 border-teal-200':'border-stone-100 hover:border-stone-200'
                    } ${q.isUrgent&&q.status!=='Answered'?'border-l-4 border-l-amber-400':''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${s.dot||'bg-stone-300'}`}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-stone-800 truncate">{q.title}</p>
                          {q.isUrgent  && <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">Urgent</span>}
                          {q.isFlagged && <span className="badge bg-red-50 text-red-600 border border-red-100 text-xs">Flagged</span>}
                          {q.isPrivate && <span className="badge bg-stone-100 text-stone-500 text-xs">Private</span>}
                        </div>
                        <p className="text-xs text-stone-400 truncate mb-1.5">{q.content}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-stone-50 text-stone-500 px-2 py-0.5 rounded-md">{q.category}</span>
                          <span className="text-xs text-stone-400">{q.userName}</span>
                          <span className={`badge text-xs ${s.cls||''}`}>{q.status}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Reply panel */}
        <div className="w-full xl:w-[420px] shrink-0">
          {selected ? (
            <div className="card sticky top-20 space-y-5">
              {/* Question header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-display text-lg text-stone-800 leading-snug flex-1">{selected.title}</p>
                  <span className={`badge text-xs shrink-0 ${STATUS_CFG[selected.status]?.cls||''}`}>{selected.status}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <span className="badge bg-stone-100 text-stone-600 text-xs">{selected.category}</span>
                  <span className="badge bg-stone-100 text-stone-600 text-xs">{selected.userName}</span>
                  {selected.isUrgent  && <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">Urgent</span>}
                  {selected.isPrivate && <span className="badge bg-stone-100 text-stone-500 text-xs">Private</span>}
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm text-stone-600 leading-relaxed max-h-36 overflow-y-auto">
                  {selected.content}
                </div>
              </div>

              {selected.status === 'Answered' ? (
                <>
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-teal-700 mb-2">Your reply</p>
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{selected.reply}</p>
                  </div>
                  <button onClick={toggleFlag} className={`btn-soft w-full text-sm ${selected.isFlagged?'border-red-200 text-red-600 hover:bg-red-50':''}`}>
                    {selected.isFlagged ? 'Remove flag' : 'Flag for admin review'}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Insert template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button key={t.label} onClick={() => setReply(r => r+t.text)}
                          className="text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-xl px-3 py-2.5 text-left transition-colors font-medium">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Your reply</label>
                    <textarea className="input resize-none text-sm leading-relaxed" rows={7}
                      placeholder="Write a clear, kind and helpful reply…"
                      value={reply} onChange={e => setReply(e.target.value)} />
                    <p className="text-xs text-stone-400 mt-1 text-right">{reply.length} characters</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={sendReply} disabled={busy||!reply.trim()} className="btn-main flex-1">
                      {busy ? 'Sending…' : 'Send reply'}
                    </button>
                    <button onClick={toggleFlag}
                      className={`btn-soft px-4 text-sm ${selected.isFlagged?'border-red-200 text-red-600 hover:bg-red-50':''}`}
                      title="Flag for admin review">
                      {selected.isFlagged ? 'Unflag' : 'Flag'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card bg-stone-50 border-stone-100 text-center py-20">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              </div>
              <p className="text-stone-400 text-sm">Select a question to view and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Write Article tab ─────────────────────────────────────────────────────── */
function ArticlesTab({ user }) {
  const [articles, setArticles] = useState([])
  const [form, setForm] = useState({ title:'', category:'', summary:'', tips:['','',''] })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'write'

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(() => {
    axios.get('/api/articles').then(r => setArticles(r.data.filter(a => a.authorName === user.name))).finally(()=>setLoading(false))
  }, [user.name])
  useEffect(() => { load() }, [load])

  const setTip = (i, val) => setForm(f => { const tips=[...f.tips]; tips[i]=val; return {...f,tips} })
  const addTip = () => setForm(f => ({...f, tips:[...f.tips,'']}))
  const removeTip = i => setForm(f => ({...f, tips:f.tips.filter((_,j)=>j!==i)}))

  const submit = async e => {
    e.preventDefault()
    const filteredTips = form.tips.filter(t=>t.trim())
    if (filteredTips.length === 0) { showToast('Add at least one tip.', false); return }
    setBusy(true)
    try {
      await axios.post('/api/articles', { ...form, tips:filteredTips, authorId:user.id, authorName:user.name })
      showToast('Article submitted for admin review.')
      setForm({ title:'', category:'', summary:'', tips:['','',''] })
      setView('list'); load()
    } catch { showToast('Something went wrong.', false) }
    finally { setBusy(false) }
  }

  return (
    <div className="fade">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-lift text-sm font-semibold ${toast.ok?'bg-stone-800 text-white':'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl text-stone-800">Articles</h2>
          <p className="text-stone-500 mt-1 text-sm">Write helpful articles for children. They go live after admin approval.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView('list')} className={view==='list'?'btn-main btn-sm':'btn-soft btn-sm'}>My articles</button>
          <button onClick={()=>setView('write')} className={view==='write'?'btn-main btn-sm':'btn-soft btn-sm'}>+ Write new</button>
        </div>
      </div>

      {view === 'list' && (
        <>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-stone-100"/>)}</div>
          ) : articles.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <p className="text-stone-400 text-sm mb-3">You haven't written any articles yet.</p>
              <button onClick={()=>setView('write')} className="btn-main btn-sm">Write your first article</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {articles.map(a => (
                <div key={a.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-stone-800 text-sm leading-snug">{a.title}</p>
                    <span className={`badge text-xs shrink-0 ${a.approved?'bg-teal-50 text-teal-700 border border-teal-200':'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {a.approved?'Published':'Pending review'}
                    </span>
                  </div>
                  <span className="badge bg-stone-100 text-stone-600 text-xs mb-2">{a.category}</span>
                  <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{a.summary}</p>
                  <div className="mt-3 pt-3 border-t border-stone-50">
                    <p className="text-xs text-stone-400">{a.tips.length} tips included</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'write' && (
        <div className="max-w-2xl">
          <div className="card shadow-sm">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Article title</label>
                <input className="input" placeholder="e.g. How to Handle Exam Stress"
                  value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ARTICLE_CATS.map(c => (
                    <button type="button" key={c} onClick={()=>setForm(f=>({...f,category:c}))}
                      className={`text-sm py-2.5 px-3 rounded-xl border font-medium transition-all text-left ${
                        form.category===c?'border-teal-400 bg-teal-50 text-teal-700':'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Summary</label>
                <textarea className="input resize-none leading-relaxed" rows={3}
                  placeholder="A brief overview of what this article covers and why it matters…"
                  value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Tips &amp; key points</label>
                  <button type="button" onClick={addTip} className="btn-ghost btn-sm text-teal-600">+ Add tip</button>
                </div>
                <div className="space-y-2">
                  {form.tips.map((tip,i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                      <input className="input flex-1" placeholder={`Tip ${i+1}`}
                        value={tip} onChange={e=>setTip(i,e.target.value)} />
                      {form.tips.length > 1 && (
                        <button type="button" onClick={()=>removeTip(i)} className="text-stone-300 hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">Add as many tips as you need. Empty fields will be ignored.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-main flex-1 py-3" disabled={busy||!form.category}>
                  {busy ? 'Submitting…' : 'Submit for review'}
                </button>
                <button type="button" onClick={()=>setView('list')} className="btn-soft px-5">Cancel</button>
              </div>
            </form>
          </div>
          <p className="text-xs text-stone-400 mt-3 text-center">Articles are reviewed by the admin before being published to children.</p>
        </div>
      )}
    </div>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function CounselorHome() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('questions')
  const handleLogout = () => { logout(); nav('/login') }
  return (
    <Shell user={user} logout={handleLogout} tab={tab} setTab={setTab}>
      {tab==='questions' && <QuestionsTab user={user}/>}
      {tab==='articles'  && <ArticlesTab  user={user}/>}
    </Shell>
  )
}
