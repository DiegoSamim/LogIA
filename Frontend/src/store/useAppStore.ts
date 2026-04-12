import { create } from 'zustand'
import type { UserDTO } from '@/data/dtos'

interface AppState {
  accessToken: string | null
  currentUser: UserDTO | null
  setAccessToken: (token: string | null) => void
  setCurrentUser: (user: UserDTO | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  accessToken: null,
  currentUser: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () => set({ accessToken: null, currentUser: null }),
}))
