import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as apiLogin } from '../api/auth'
import {
  clearSession,
  loadStoredUser,
  loadTokens,
  saveSession,
  setUnauthorizedHandler,
} from '../api/client'
import type { AuthUser } from '../types/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (tenantCode: string, username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(async () => {
    await clearSession()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
    })
    ;(async () => {
      try {
        const { accessToken } = await loadTokens()
        if (accessToken) {
          const stored = await loadStoredUser<AuthUser>()
          if (stored) setUser(stored)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const signIn = useCallback(async (tenantCode: string, username: string, password: string) => {
    const data = await apiLogin(tenantCode, username, password)
    await saveSession(data.access_token, data.refresh_token, JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
