import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthInit } from '@/hooks/useAuthInit'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Projects from '@/pages/Project/Projects'
import Sobre from '@/pages/Sobre'

export default function App() {
  useAuthInit()

  return (
    <BrowserRouter>
      <Routes>
        {/* Sempre pública */}
        <Route path="/" element={<Home />} />

        {/* Só para não-logados — redireciona logados para /projects */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Só para logados — redireciona não-logados para /login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/projects" element={<Projects />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<div />} />
            <Route path="/chat" element={<div />} />
            <Route path="/tasks" element={<div />} />
            <Route path="/sobre" element={<Sobre />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
