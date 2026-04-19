import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAppStore } from '@/store/useAppStore'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
export const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : configuredApiUrl || '/api/v1'

const baseConfig = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create(baseConfig)
const refreshClient = axios.create(baseConfig)

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined
    const requestUrl = original?.url ?? ''
    const isRefreshRequest = requestUrl.includes('/auth/refresh')

    if (error.response?.status === 401 && original && !original._retry && !isRefreshRequest) {
      original._retry = true

      try {
        const { data } = await refreshClient.post<{ access_token: string }>('/auth/refresh')
        useAppStore.getState().setAccessToken(data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        useAppStore.getState().logout()
      }
    }

    if (error.response?.status === 401 && isRefreshRequest) {
      useAppStore.getState().logout()
    }

    return Promise.reject(error)
  }
)

export default api

export function buildFileUrl(path: string): string {
  const base = /^https?:\/\//.test(API_BASE_URL)
    ? API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : window.location.origin
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
