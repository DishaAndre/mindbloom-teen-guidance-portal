import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login      from './pages/Login'
import Register   from './pages/Register'
import ChildHome  from './pages/ChildHome'
import CounselorHome from './pages/CounselorHome'
import AdminHome  from './pages/AdminHome'

function Guard({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    const dest = { child: '/home', counselor: '/counselor', admin: '/admin' }
    return <Navigate to={dest[user.role] || '/login'} replace />
  }
  return children
}

function Root() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'counselor') return <Navigate to="/counselor" replace />
  if (user.role === 'admin')     return <Navigate to="/admin"     replace />
  return <Navigate to="/home"   replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Root />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/home"      element={<Guard role="child"><ChildHome /></Guard>} />
          <Route path="/counselor" element={<Guard role="counselor"><CounselorHome /></Guard>} />
          <Route path="/admin"     element={<Guard role="admin"><AdminHome /></Guard>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
