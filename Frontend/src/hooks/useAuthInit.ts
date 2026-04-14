import { useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'

// Evita double-invocation do React StrictMode em dev
let initialized = false

export function useAuthInit() {
  const { setAccessToken, setCurrentUser, setAuthReady } = useAppStore()

  useEffect(() => {
    if (initialized) return
    initialized = true

    if (localStorage.getItem('session_ended')) {
      setAuthReady(true)
      return
    }

    authService
      .refresh()
      .then(({ data }) => {
        setAccessToken(data.access_token)
        return authService.me()
      })
      .then(({ data }) => {
        setCurrentUser(data)
      })
      .catch(() => {
        // Sem cookie válido — usuário não está logado, não faz nada
      })
      .finally(() => {
        setAuthReady(true)
      })
  }, [setAccessToken, setAuthReady, setCurrentUser])
}
