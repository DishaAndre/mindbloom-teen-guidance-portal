import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const STATUS_CFG = {
  'Submitted':             'bg-amber-50 text-amber-700 border border-amber-200',
  'Under Review':          'bg-blue-50 text-blue-700 border border-blue-200',
  'Assigned to Counselor': 'bg-violet-50 text-violet-700 border border-violet-200',
  'Answered':              'bg-teal-50 text-teal-700 border border-teal-200',
}
const STATUS_OPTIONS = ['Submitted','Under Review','Assigned to Counselor','Answered']
const TABS = ['overview','questions','users','articles']

function Shell({ logout, tab, setTab, children }) {
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
            <span className="badge bg-stone-100 text-stone-600 border border-stone-200 text-xs">Admin</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  tab===t ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}>{t}</button>
            ))}
          </nav>
          <button onClick={logout} className="btn-ghost btn-sm text-stone-400">Sign out</button>
        </div>
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${tab===t?'bg-teal-600 text-white':'text-stone-500 hover:bg-stone-100'}`}>{t}</button>
          ))}
        </div>
      </header>
      <main className="flex-1 w-full px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">{children}</main>
    </div>
  )
}

export default function AdminHome() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab]       = useState('overview')
  const [qs, setQs]         = useState([])
  const [users, setUsers]   = useState([])
  const [articles, setArticles] = useState([])
  const [stats, setStats]   = useState(null)
  const [toast, setToast]   = useState(null)
  const [qFilter, setQFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const counselors = users.filter(u => u.role === 'counselor')
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async () => {
    try {
      const [qr,ur,ar,sr] = await Promise.all([
        axios.get('/api/questions'), axios.get('/api/users'),
        axios.get('/api/articles'),  axios.get('/api/stats'),
      ])
      setQs(qr.data); setUsers(ur.data); setArticles(ar.data); setStats(sr.data)
    } catch { showToast('Failed to load.', false) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const assignQ    = async (id, cId)   => { if(!cId) return; await axios.put(`/api/questions/${id}/assign`,{counselorId:cId}); showToast('Assigned.'); load() }
  const setStatus  = async (id, s)     => { await axios.put(`/api/questions/${id}/status`,{status:s}); showToast('Updated.'); load() }
  const deleteQ    = async id          => { if(!confirm('Remove this question?')) return; await axios.delete(`/api/questions/${id}`); showToast('Removed.'); load() }
  const deleteUser = async id          => { if(!confirm('Remove this user?')) return; await axios.delete(`/api/users/${id}`); showToast('Removed.'); load() }
  const approveArt = async id          => { await axios.put(`/api/articles/${id}/approve`); showToast('Article approved.'); load() }
  const deleteArt  = async id          => { if(!confirm('Remove this article?')) return; await axios.delete(`/api/articles/${id}`); showToast('Removed.'); load() }

  const filteredQs = qFilter==='all' ? qs
    : qFilter==='flagged' ? qs.filter(q=>q.isFlagged)
    : qFilter==='urgent'  ? qs.filter(q=>q.isUrgent&&q.status!=='Answered')
    : qs.filter(q=>q.status===qFilter)

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <Shell logout={handleLogout} tab={tab} setTab={setTab}>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-lift text-sm font-semibold ${toast.ok?'bg-stone-800 text-white':'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i=><div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-stone-100"/>)}
        </div>
      ) : (
        <div className="fade">

          {/* ── Overview ── */}
          {tab==='overview' && stats && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl text-stone-800 mb-5">Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label:'Children',   val:stats.children,   bg:'bg-teal-50 border-teal-200',   t:'text-teal-700' },
                    { label:'Counselors', val:stats.counselors, bg:'bg-blue-50 border-blue-200',   t:'text-blue-700' },
                    { label:'Questions',  val:stats.total,      bg:'bg-stone-50 border-stone-200', t:'text-stone-800' },
                    { label:'Answered',   val:stats.answered,   bg:'bg-stone-50 border-stone-200', t:'text-stone-800' },
                    { label:'Pending',    val:stats.pending,    bg:'bg-stone-50 border-stone-200', t:'text-stone-800' },
                    { label:'Urgent',     val:stats.urgent,     bg:stats.urgent>0?'bg-amber-50 border-amber-300':'bg-stone-50 border-stone-200', t:stats.urgent>0?'text-amber-700':'text-stone-800' },
                    { label:'Flagged',    val:stats.flagged,    bg:stats.flagged>0?'bg-red-50 border-red-200':'bg-stone-50 border-stone-200',    t:stats.flagged>0?'text-red-700':'text-stone-800' },
                    { label:'Articles',   val:stats.articles,   bg:'bg-stone-50 border-stone-200', t:'text-stone-800' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
                      <p className={`font-display text-3xl ${s.t}`}>{s.val}</p>
                      <p className="text-xs font-medium text-stone-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending articles */}
              {stats.pendingArticles > 0 && (
                <div className="card border-amber-200 bg-amber-50 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">{stats.pendingArticles} article{stats.pendingArticles>1?'s':''} waiting for approval</p>
                    <p className="text-xs text-amber-600 mt-0.5">Review and approve counselor-written articles before they go live.</p>
                  </div>
                  <button onClick={()=>setTab('articles')} className="btn btn-sm bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 shrink-0">Review</button>
                </div>
              )}

              {/* Flagged */}
              {stats.flagged > 0 && (
                <div className="card border-red-100">
                  <p className="font-semibold text-stone-800 text-sm mb-3">Flagged questions requiring attention</p>
                  <div className="space-y-2">
                    {qs.filter(q=>q.isFlagged).map(q => (
                      <div key={q.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 truncate">{q.title}</p>
                          <p className="text-xs text-stone-400">{q.userName} · {q.category}</p>
                        </div>
                        <button onClick={()=>deleteQ(q.id)} className="btn-red btn-sm shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unassigned */}
              {qs.filter(q=>!q.assignedTo&&q.status!=='Answered').length > 0 && (
                <div className="card">
                  <p className="font-semibold text-stone-800 text-sm mb-3">
                    Unassigned questions ({qs.filter(q=>!q.assignedTo&&q.status!=='Answered').length})
                  </p>
                  <div className="space-y-2">
                    {qs.filter(q=>!q.assignedTo&&q.status!=='Answered').map(q => (
                      <div key={q.id} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 truncate">{q.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-stone-400">{q.category}</span>
                            {q.isUrgent && <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">Urgent</span>}
                          </div>
                        </div>
                        <select onChange={e=>assignQ(q.id,e.target.value)} defaultValue=""
                          className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white text-stone-600 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30">
                          <option value="" disabled>Assign to…</option>
                          {counselors.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Questions ── */}
          {tab==='questions' && (
            <div>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="font-display text-3xl text-stone-800">Questions</h2>
                <p className="text-sm text-stone-400">{qs.length} total</p>
              </div>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
                {['all','Submitted','Under Review','Assigned to Counselor','Answered','urgent','flagged'].map(f => (
                  <button key={f} onClick={()=>setQFilter(f)}
                    className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold border capitalize transition-all ${
                      qFilter===f ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                    }`}>{f}</button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredQs.map(q => (
                  <div key={q.id} className={`card ${q.isFlagged?'border-l-4 border-l-red-400':q.isUrgent&&q.status!=='Answered'?'border-l-4 border-l-amber-400':''}`}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-stone-800">{q.title}</p>
                          {q.isUrgent  && <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">Urgent</span>}
                          {q.isFlagged && <span className="badge bg-red-50 text-red-600 border border-red-100 text-xs">Flagged</span>}
                          {q.isPrivate && <span className="badge bg-stone-100 text-stone-500 text-xs">Private</span>}
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-1 mb-2">{q.content}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-stone-50 text-stone-500 px-2 py-0.5 rounded-md">{q.category}</span>
                          <span className="text-xs text-stone-400">by {q.userName}</span>
                          <span className={`badge text-xs ${STATUS_CFG[q.status]||'bg-stone-100 text-stone-500'}`}>{q.status}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <select value={q.assignedTo||''} onChange={e=>e.target.value&&assignQ(q.id,e.target.value)}
                          className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white text-stone-600 focus:outline-none focus:border-teal-400 max-w-[180px]">
                          <option value="">{q.counselorName||'Assign counselor…'}</option>
                          {counselors.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={q.status} onChange={e=>setStatus(q.id,e.target.value)}
                          className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white text-stone-600 focus:outline-none focus:border-teal-400 max-w-[180px]">
                          {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={()=>deleteQ(q.id)} className="btn-red btn-sm">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredQs.length===0 && <div className="card text-center py-12"><p className="text-stone-400 text-sm">No questions match this filter.</p></div>}
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab==='users' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-3xl text-stone-800">Users</h2>
                <p className="text-sm text-stone-400">{users.length} registered</p>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {users.map(u => (
                  <div key={u.id} className="card flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 font-display text-lg flex items-center justify-center shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{u.name}</p>
                      <p className="text-xs text-stone-400">@{u.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge text-xs ${u.role==='admin'?'bg-stone-200 text-stone-700':u.role==='counselor'?'bg-blue-50 text-blue-700 border border-blue-200':'bg-teal-50 text-teal-700 border border-teal-200'}`}>{u.role}</span>
                        {u.age          && <span className="text-xs text-stone-400">Age {u.age}</span>}
                        {u.specialization && <span className="text-xs text-stone-400 truncate max-w-[100px]">{u.specialization}</span>}
                      </div>
                    </div>
                    {u.role==='child' && (
                      <button onClick={()=>deleteUser(u.id)} className="btn-red btn-sm shrink-0">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Articles ── */}
          {tab==='articles' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-3xl text-stone-800">Articles</h2>
                <p className="text-sm text-stone-400">{articles.length} total · {articles.filter(a=>!a.approved).length} pending</p>
              </div>
              <div className="space-y-4">
                {articles.map(a => (
                  <div key={a.id} className={`card ${!a.approved?'border-l-4 border-l-amber-400':''}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-stone-800">{a.title}</p>
                          <span className={`badge text-xs ${a.approved?'bg-teal-50 text-teal-700 border border-teal-200':'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {a.approved?'Published':'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-2 mb-2 leading-relaxed">{a.summary}</p>
                        <div className="flex items-center gap-3 text-xs text-stone-400">
                          <span className="bg-stone-50 px-2 py-0.5 rounded-md">{a.category}</span>
                          <span>by {a.authorName}</span>
                          <span>{a.tips?.length} tips</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {!a.approved && (
                          <button onClick={()=>approveArt(a.id)} className="btn-main btn-sm">Approve</button>
                        )}
                        <button onClick={()=>deleteArt(a.id)} className="btn-red btn-sm">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
                {articles.length===0 && <div className="card text-center py-12"><p className="text-stone-400 text-sm">No articles yet.</p></div>}
              </div>
            </div>
          )}

        </div>
      )}
    </Shell>
  )
}
