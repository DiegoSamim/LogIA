import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from '@/data/dtos'

interface CurrentProject {
  id: string
  name: string
}

interface AppState {
  accessToken: string | null
  currentUser: UserDTO | null
  authReady: boolean
  currentProject: CurrentProject | null
  setAccessToken: (token: string | null) => void
  setCurrentUser: (user: UserDTO | null) => void
  setAuthReady: (ready: boolean) => void
  setCurrentProject: (project: CurrentProject | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      accessToken: null,
      currentUser: null,
      authReady: false,
      currentProject: null,
      setAccessToken: (token) => {
        if (token) localStorage.removeItem('session_ended')
        set({ accessToken: token })
      },
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthReady: (ready) => set({ authReady: ready }),
      setCurrentProject: (project) => set({ currentProject: project }),
      logout: () => set({ accessToken: null, currentUser: null, authReady: true, currentProject: null }),
    }),
    {
      name: 'logia-app',
      partialize: (state) => ({ currentProject: state.currentProject }),
    },
  ),
)
