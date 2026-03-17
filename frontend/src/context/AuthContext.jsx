import React, { createContext, useContext, useState } from 'react'
const Ctx = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('mb') || 'null') } catch { return null } })
  const login  = u => { setUser(u); localStorage.setItem('mb', JSON.stringify(u)) }
  const logout = () => { setUser(null); localStorage.removeItem('mb') }
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
