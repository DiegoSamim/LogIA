import { Navigate, Outlet } from 'react-router-dom'
import logo from '@/assets/Icon.png'
import { useAppStore } from '@/store/useAppStore'

function AuthLoadingScreen() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-surface-base">
      <img
        src={logo}
        alt="LogIA"
        className="auth-loading-logo h-10 w-auto"
      />
    </div>
  )
}

export function ProtectedRoute() {
  const { accessToken, authReady } = useAppStore()

  if (!authReady) return <AuthLoadingScreen />
  if (!accessToken) return <Navigate to="/login" replace />

  return <Outlet />
}
