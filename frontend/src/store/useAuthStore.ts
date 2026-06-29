import { create } from 'zustand'

interface User {
  id: string
  username: string
  name: string
  role: string | { name: string }
  tenantId?: string
  tenantCode?: string
  tenantName?: string
  permissions?: string[]
}

interface AuthState {
  user: User | null
  permissions: string[]
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  hasPermission: (...codes: string[]) => boolean
}

const getRoleName = (role: User['role']) =>
  typeof role === 'string' ? role : role.name

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (user, accessToken, refreshToken) => {
    const permissions = user.permissions || []
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({
      user: { ...user, role: getRoleName(user.role) },
      permissions,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({
      user: null,
      permissions: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  setAccessToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ accessToken: token })
  },

  setUser: (user) => {
    const permissions = user.permissions || []
    set({
      user: { ...user, role: getRoleName(user.role) },
      permissions,
    })
  },

  hasPermission: (...codes) => {
    const { permissions } = get()
    return codes.some((code) => permissions.includes(code))
  },
}))
