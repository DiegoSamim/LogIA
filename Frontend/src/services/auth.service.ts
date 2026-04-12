import api from './api'
import type { UserDTO } from '@/data/dtos'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

function clearAccessibleBrowserData() {
  if (typeof window === 'undefined') return

  window.localStorage.clear()
  window.sessionStorage.clear()

  document.cookie.split(';').forEach((cookie) => {
    const [rawName] = cookie.split('=')
    const name = rawName?.trim()
    if (!name) return

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
}

export const authService = {
  register: (data: RegisterRequest) =>
    api.post<TokenResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data),

  refresh: () =>
    api.post<TokenResponse>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  logoutOptimistic: () => {
    clearAccessibleBrowserData()
    localStorage.setItem('session_ended', '1')  // persiste a intenção de logout mesmo se a API falhar

    void fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
  },

  me: () =>
    api.get<UserDTO>('/auth/me'),
}
