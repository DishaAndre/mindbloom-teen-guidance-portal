import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const DEMOS = [
  { label: 'Child',     u: 'child',     p: 'child123',     desc: 'Age 12 student' },
  { label: 'Counselor', u: 'counselor', p: 'counselor123', desc: 'Dr. Priya Mehta' },
  { label: 'Admin',     u: 'admin',     p: 'admin123',     desc: 'Platform admin' },
]

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5c0 2.5 1.2 4.7 3.1 6.1L12 19l3.4-2.4c1.9-1.4 3.1-3.6 3.1-6.1C18.5 6.5 15.5 3 12 3z" fill="white" opacity=".9"/>
        <circle cx="12" cy="10.5" r="2.5" fill="white" opacity=".5"/>
      </svg>
    </div>
    <span className="font-display text-stone-800 text-xl font-medium">MindBloom</span>
  </div>
)

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const user = (await axios.post('/api/login', form)).data
      login(user)
      nav(user.role === 'counselor' ? '/counselor' : user.role === 'admin' ? '/admin' : '/home')
    } catch (e) { setErr(e.response?.data?.error || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col bg-teal-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-teal-600 -translate-y-1/2 translate-x-1/4 opacity-50" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-800 translate-y-1/3 -translate-x-1/4 opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          <Logo />
          <div>
            <h1 className="font-display text-5xl text-white leading-[1.15] mb-5">
              A safe space<br />for young minds<br />to grow.
            </h1>
            <p className="text-teal-100/80 text-lg leading-relaxed max-w-sm">
              Ask anything, learn from caring counselors, and understand your emotions and relationships.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[['100%','Private'],['24 hr','Avg. reply'],['Safe','& Secure']].map(([v,l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4">
                <p className="font-display text-2xl text-white mb-1">{v}</p>
                <p className="text-teal-200 text-xs font-medium">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-col items-center justify-center bg-[#f7f8f6] p-8">
        <div className="w-full max-w-[400px] fade">
          <div className="lg:hidden mb-10"><Logo /></div>

          <h2 className="font-display text-3xl text-stone-800 mb-1">Welcome back</h2>
          <p className="text-stone-500 text-sm mb-8">Sign in to continue to MindBloom.</p>

          <div className="card shadow-lift">
            {err && (
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {err}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input className="input" placeholder="Enter your username"
                  value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required autoFocus />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Enter your password"
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
              </div>
              <button type="submit" className="btn-main w-full py-3 text-sm mt-1" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-stone-500 mt-5 mb-6">
            New to MindBloom?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">Create account</Link>
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest whitespace-nowrap">Try a demo</p>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMOS.map(d => (
              <button key={d.u} onClick={() => setForm({ username: d.u, password: d.p })}
                className="group bg-white border border-stone-200 hover:border-teal-300 hover:shadow-sm rounded-xl p-3 text-center transition-all duration-150">
                <p className="text-sm font-semibold text-stone-700 group-hover:text-teal-700 transition-colors">{d.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
