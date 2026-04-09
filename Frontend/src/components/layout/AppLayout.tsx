import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-svh bg-surface-base text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/35 lg:hidden"
        />
      )}

      {/* ── Content column ──────────────────────────────────────────────── */}
      <div className={['flex flex-1 flex-col overflow-hidden transition-[padding] duration-200', isSidebarOpen ? 'lg:pl-[196px]' : ''].join(' ')}>
        <Header isSidebarOpen={isSidebarOpen} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
