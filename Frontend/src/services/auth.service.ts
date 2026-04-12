import api from './api'
import type { UserDTO } from '@/data/dtos'

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

export const authService = {
  register: (data: RegisterRequest) =>
    api.post<TokenResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data),

  refresh: () =>
    api.post<TokenResponse>('/auth/refresh'),

  me: () =>
    api.get<UserDTO>('/auth/me'),
}
