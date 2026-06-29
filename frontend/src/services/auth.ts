import api from './api'

interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    username: string
    name: string
    role: string
    tenantId?: string
    tenantCode?: string
    tenantName?: string
    timezone?: string
    currency?: string
    permissions: string[]
  }
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface ProfileResponse {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  status: string
  timezone?: string
  currency?: string
  role: { id: string; name: string }
  permissions: string[]
}

export const authService = {
  login: (username: string, password: string, tenantCode = 'default') => {
    return api.post<LoginResponse>('/auth/login', { username, password, tenantCode })
  },

  refreshToken: (refreshToken: string) => {
    return api.post<RefreshResponse>('/auth/refresh', { refresh_token: refreshToken })
  },

  getMe: () => api.get<ProfileResponse>('/auth/me'),

  updatePreferences: (data: { timezone?: string; currency?: string }) =>
    api.patch<ProfileResponse>('/auth/me/preferences', data),
}
