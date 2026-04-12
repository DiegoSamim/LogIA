import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

export function GuestRoute() {
  const { accessToken, authReady } = useAppStore()

  // Aguarda init silenciosamente — evita flash de login/register antes de saber se está logado
  if (!authReady) return null
  if (accessToken) return <Navigate to="/projects" replace />

  return <Outlet />
}
