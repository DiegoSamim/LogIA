import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const setAccessToken = useAppStore((s) => s.setAccessToken)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    window.history.replaceState({}, '', '/auth/callback')

    setAccessToken(token)
    authService
      .me()
      .then(({ data }) => {
        setCurrentUser(data)
        navigate('/projects', { replace: true })
      })
      .catch(() => navigate('/login?error=oauth_failed', { replace: true }))
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-surface-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent-indigo" />
        <p className="text-xs text-white/40">Autenticando...</p>
      </div>
    </div>
  )
}
