'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { GrimoireUser } from './types'
import { storageAuth } from './storage'
import { api } from './api'

type AuthContextType = {
  user: GrimoireUser | null
  token: string | null
  isLoading: boolean
  signIn: (token: string, user: GrimoireUser) => void
  signOut: () => void
  updateUser: (updates: Partial<GrimoireUser>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
  updateUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GrimoireUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = storageAuth.getToken()
    const storedUser = storageAuth.getUser()
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(storedUser)
      // Verify token is still valid
      api.auth.me().then(freshUser => {
        setUser(freshUser)
        storageAuth.setUser(freshUser)
      }).catch(() => {
        // Token invalid, clear
        storageAuth.clear()
        setToken(null)
        setUser(null)
      }).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const signIn = useCallback((newToken: string, newUser: GrimoireUser) => {
    storageAuth.setToken(newToken)
    storageAuth.setUser(newUser)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const signOut = useCallback(() => {
    storageAuth.clear()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<GrimoireUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      storageAuth.setUser(updated)
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
