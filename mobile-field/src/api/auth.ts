import { api } from './client'
import type { AuthUser, LoginResponse } from '../types/api'

export async function login(
  tenantCode: string,
  username: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', {
    tenantCode,
    username,
    password,
  })
  return res.data
}

export type { AuthUser }
