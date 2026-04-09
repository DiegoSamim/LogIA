import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Projects from '@/pages/Project/Projects'
import AppLayout from '@/components/layout/AppLayout'
import Sobre from '@/pages/Sobre'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / standalone */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<Projects />} />

        {/* App shell — sidebar + header */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div />} />
          <Route path="/chat" element={<div />} />
          <Route path="/tasks" element={<div />} />
          <Route path="/sobre" element={<Sobre />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
