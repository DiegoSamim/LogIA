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
  currentTaskTitle: string | null
  setAccessToken: (token: string | null) => void
  setCurrentUser: (user: UserDTO | null) => void
  setAuthReady: (ready: boolean) => void
  setCurrentProject: (project: CurrentProject | null) => void
  setCurrentTaskTitle: (title: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      accessToken: null,
      currentUser: null,
      authReady: false,
      currentProject: null,
      currentTaskTitle: null,
      setAccessToken: (token) => {
        if (token) localStorage.removeItem('session_ended')
        set({ accessToken: token })
      },
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthReady: (ready) => set({ authReady: ready }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setCurrentTaskTitle: (title) => set({ currentTaskTitle: title }),
      logout: () => set({ accessToken: null, currentUser: null, authReady: true, currentProject: null, currentTaskTitle: null }),
    }),
    {
      name: 'logia-app',
      partialize: (state) => ({ currentProject: state.currentProject }),
    },
  ),
)
