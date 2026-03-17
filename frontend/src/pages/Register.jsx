import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', password: '', age: '' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const user = (await axios.post('/api/register', form)).data
      login(user); nav('/home')
    } catch (e) { setErr(e.response?.data?.error || 'Something went wrong.') }
    finally { setBusy(false) }
  }
  const f = k => e => setForm(p => ({...p, [k]: e.target.value}))

  return (
    <div className="min-h-screen bg-[#f7f8f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] fade">
        <Link to="/login" className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5c0 2.5 1.2 4.7 3.1 6.1L12 19l3.4-2.4c1.9-1.4 3.1-3.6 3.1-6.1C18.5 6.5 15.5 3 12 3z" fill="white" opacity=".9"/>
              <circle cx="12" cy="10.5" r="2.5" fill="white" opacity=".5"/>
            </svg>
          </div>
          <span className="font-display text-stone-800 text-xl font-medium">MindBloom</span>
        </Link>

        <h2 className="font-display text-3xl text-stone-800 mb-1">Create account</h2>
        <p className="text-stone-500 text-sm mb-8">Free for children aged 10 to 13.</p>

        <div className="card shadow-lift">
          {err && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {err}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input className="input" placeholder="e.g. Alex" value={form.name} onChange={f('name')} required />
              </div>
              <div>
                <label className="label">Age</label>
                <input type="number" className="input" placeholder="10–13" min="10" max="13" value={form.age} onChange={f('age')} required />
              </div>
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="Choose a nickname (not your real name)" value={form.username} onChange={f('username')} required />
              <p className="text-xs text-stone-400 mt-1.5">Use a nickname to protect your privacy.</p>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="At least 6 characters" minLength="6" value={form.password} onChange={f('password')} required />
            </div>
            <button type="submit" className="btn-main w-full py-3 text-sm mt-1" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
