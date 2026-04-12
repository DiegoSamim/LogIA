import { create } from 'zustand'
import type { UserDTO } from '@/data/dtos'

interface AppState {
  accessToken: string | null
  currentUser: UserDTO | null
  authReady: boolean
  setAccessToken: (token: string | null) => void
  setCurrentUser: (user: UserDTO | null) => void
  setAuthReady: (ready: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  accessToken: null,
  currentUser: null,
  authReady: false,
  setAccessToken: (token) => {
    if (token) localStorage.removeItem('session_ended')
    set({ accessToken: token })
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthReady: (ready) => set({ authReady: ready }),
  logout: () => set({ accessToken: null, currentUser: null, authReady: true }),
}))
