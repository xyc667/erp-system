import axios from 'axios'
import { message } from 'antd'
import i18n from '../i18n'
import { useAuthStore } from '../store/useAuthStore'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api'

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean
  }
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const payload = data as { message?: string | string[] }
  if (Array.isArray(payload.message)) return payload.message.join(', ')
  if (typeof payload.message === 'string') return payload.message
  return undefined
}

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const response = await axios.post(`${apiBaseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token } = response.data
          useAuthStore.getState().setAccessToken(access_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
    }

    if (!originalRequest?.silent) {
      const status = error.response?.status
      const serverMessage = extractErrorMessage(error.response?.data)
      if (status === 403) {
        message.error(serverMessage || i18n.t('errors.forbidden'))
      } else if (status && status >= 500) {
        message.error(serverMessage || i18n.t('errors.server'))
      } else if (serverMessage) {
        message.error(serverMessage)
      } else if (!error.response) {
        message.error(i18n.t('errors.network'))
      }
    }

    return Promise.reject(error)
  }
)

export default api