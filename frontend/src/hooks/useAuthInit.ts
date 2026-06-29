import { useEffect, useState } from 'react'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/useAuthStore'
import { useRegionalStore } from '../store/useRegionalStore'

export function useAuthInit() {
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const applyFromServer = useRegionalStore((state) => state.applyFromServer)

  useEffect(() => {
    const restoreSession = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        const response = await authService.getMe()
        const data = response.data
        setUser({
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role.name,
          permissions: data.permissions,
        })
        applyFromServer({ timezone: data.timezone, currency: data.currency })
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [isAuthenticated, setUser, logout, applyFromServer])

  return loading
}
