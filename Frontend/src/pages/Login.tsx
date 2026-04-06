import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: integrate with auth service
  }

  return (
    <div className="min-h-svh bg-surface-base flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-[400px] bg-surface-container border border-white/10 rounded-card p-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-accent-indigo text-2xl">⚡</span>
            <span className="text-white/90 text-xl font-semibold tracking-tight">LogIA</span>
          </div>
          <p className="text-white/50 text-sm">Seu diário técnico inteligente</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/40 tracking-widest uppercase">
              E-mail
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="seu@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full bg-surface-high border border-white/10 rounded-btn
                px-3 py-2.5 text-sm text-white/90 placeholder:text-white/25
                outline-none
                focus:border-accent-indigo focus:shadow-[0_0_0_2px_rgb(99_102_241_/_0.2)]
                transition-[border-color,box-shadow] duration-150
              "
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/40 tracking-widest uppercase">
                Senha
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-accent-indigo tracking-widest uppercase hover:text-indigo-400 transition-colors duration-150"
              >
                Esqueceu?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full bg-surface-high border border-white/10 rounded-btn
                px-3 py-2.5 text-sm text-white/90
                outline-none
                focus:border-accent-indigo focus:shadow-[0_0_0_2px_rgb(99_102_241_/_0.2)]
                transition-[border-color,box-shadow] duration-150
              "
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="
              w-full mt-1 py-3 rounded-btn
              bg-gradient-to-[155deg] from-accent-indigo to-indigo-500
              text-white text-xs font-semibold tracking-widest uppercase
              hover:opacity-90 active:scale-[0.98]
              transition-[opacity,transform] duration-150
              cursor-pointer
            "
          >
            Entrar
          </button>
        </form>

        {/* Divider */}
        <div className="border-t border-white/10 my-7" />

        {/* Register link */}
        <p className="text-center text-sm text-white/40">
          Não tem conta?{' '}
          <Link
            to="/register"
            className="text-white/90 font-semibold hover:text-white transition-colors duration-150"
          >
            Cadastre-se
          </Link>
        </p>
      </div>

      {/* Footer status bar */}
      <div className="mt-8 flex items-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-white/25 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          System Ready
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white/25 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Node 20.x
        </span>
      </div>
    </div>
  )
}
