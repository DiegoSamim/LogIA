import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '@/assets/Icon.png'
import backgroundAnimation from '@/assets/BackgroundAnimation.mp4'
import { EyeIcon, EyeOffIcon } from '@/components/icons/PasswordVisibilityIcons'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Pelo menos uma letra', test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: 'Pelo menos um número', test: (p: string) => /[0-9]/.test(p) },
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAccessToken, setCurrentUser } = useAppStore()

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setShowRules(true)
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const { data } = await authService.register({ name, email, password })
      setAccessToken(data.access_token)
      const { data: user } = await authService.me()
      setCurrentUser(user)
      navigate('/projects')
    } catch (err: unknown) {
      const httpErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const httpStatus = httpErr?.response?.status
      const detail = httpErr?.response?.data?.detail
      if (!httpStatus) {
        setError('Serviço indisponível. Verifique sua conexão.')
      } else {
        setError(detail ?? 'Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-surface-low px-4 py-8 sm:px-6 md:px-10">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={backgroundAnimation} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-surface-low/70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.25),transparent_65%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)] blur-2xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-[460px] rounded-[20px] border border-white/10 bg-surface-container/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <img onClick={() => {
                navigate('/Home')
              }} src={logo} alt="Logo da LogIA" className="h-12 w-auto object-contain hover: cursor-pointer" />
              <h1 className="text-3xl leading-none text-white/95 font-['Sora']">
                <span className="font-semibold">Log</span>
                <span className="font-bold tracking-[0.04em] text-accent-violet font-['Space_Grotesk']">
                  IA
                </span>
              </h1>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white/95">Criar sua conta</h2>
              <p className="mt-1 text-sm text-white/55">Comece a organizar seu diário técnico inteligente</p>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-btn border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                Nome
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  w-full rounded-btn border border-white/12 bg-surface-high/85 px-3.5 py-3
                  text-sm text-white/90 placeholder:text-white/30 outline-none
                  transition-[border-color,box-shadow,background-color] duration-150
                  focus:border-accent-indigo focus:bg-surface-high
                  focus:shadow-[0_0_0_3px_rgb(99_102_241/0.2)]
                "
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-btn border border-white/12 bg-surface-high/85 px-3.5 py-3
                  text-sm text-white/90 placeholder:text-white/30 outline-none
                  transition-[border-color,box-shadow,background-color] duration-150
                  focus:border-accent-indigo focus:bg-surface-high
                  focus:shadow-[0_0_0_3px_rgb(99_102_241/0.2)]
                "
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (showRules) setShowRules(true)
                  }}
                  className="
                    w-full rounded-btn border border-white/12 bg-surface-high/85 px-3.5 py-3 pr-10
                    text-sm text-white/90 outline-none
                    transition-[border-color,box-shadow,background-color] duration-150
                    focus:border-accent-indigo focus:bg-surface-high
                    focus:shadow-[0_0_0_3px_rgb(99_102_241/0.2)]
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors duration-150 hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Requisitos — aparecem só após tentativa de envio */}
              {showRules && (
                <ul className="mt-1.5 flex flex-col gap-1">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password)
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5">
                        <span className={`text-[10px] transition-colors duration-150 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ok ? '✓' : '✗'}
                        </span>
                        <span className={`text-[11px] transition-colors duration-150 ${ok ? 'text-white/50' : 'text-white/35'}`}>
                          {rule.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="
                    w-full rounded-btn border border-white/12 bg-surface-high/85 px-3.5 py-3 pr-10
                    text-sm text-white/90 outline-none
                    transition-[border-color,box-shadow,background-color] duration-150
                    focus:border-accent-indigo focus:bg-surface-high
                    focus:shadow-[0_0_0_3px_rgb(99_102_241/0.2)]
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors duration-150 hover:text-white/60"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-2 w-full cursor-pointer rounded-btn bg-gradient-to-r
                from-accent-indigo to-indigo-500 py-3 text-xs
                font-semibold tracking-[0.16em] text-white uppercase
                transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.99]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <p className="text-center text-sm text-white/45">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-white/90 transition-colors duration-150 hover:text-white">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
