import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../config'

const ACCESS_KEY = 'erp_field_access'
const REFRESH_KEY = 'erp_field_refresh'
const USER_KEY = 'erp_field_user'

let accessToken: string | null = null
let refreshToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export async function loadTokens() {
  accessToken = await SecureStore.getItemAsync(ACCESS_KEY)
  refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
  return { accessToken, refreshToken }
}

export async function saveSession(access: string, refresh: string, userJson: string) {
  accessToken = access
  refreshToken = refresh
  await SecureStore.setItemAsync(ACCESS_KEY, access)
  await SecureStore.setItemAsync(REFRESH_KEY, refresh)
  await SecureStore.setItemAsync(USER_KEY, userJson)
}

export async function clearSession() {
  accessToken = null
  refreshToken = null
  await SecureStore.deleteItemAsync(ACCESS_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
  await SecureStore.deleteItemAsync(USER_KEY)
}

export async function loadStoredUser<T>() {
  const raw = await SecureStore.getItemAsync(USER_KEY)
  return raw ? (JSON.parse(raw) as T) : null
}

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const msg = (data as { message?: string | string[] }).message
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' ? msg : undefined
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry && refreshToken) {
      original._retry = true
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        accessToken = res.data.access_token
        await SecureStore.setItemAsync(ACCESS_KEY, accessToken!)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        await clearSession()
        onUnauthorized?.()
      }
    }
    const message = extractMessage(error.response?.data) ?? error.message
    return Promise.reject(new Error(message || '请求失败'))
  },
)
