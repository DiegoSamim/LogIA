import { create } from 'zustand'
import type { ChatMode } from '@/data/dtos'

interface ChatUiState {
  mode: ChatMode
  setMode: (mode: ChatMode) => void
  reset: () => void
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  mode: 'register',
  setMode: (mode) => set({ mode }),
  reset: () => set({ mode: 'register' }),
}))
