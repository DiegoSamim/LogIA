import { Link } from 'react-router-dom'
import icon from '@/assets/Icon.png'
import backgroundAnimation from '@/assets/BackgroundAnimation.mp4'

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    ),
    accent: 'indigo',
    label: 'Modo Registro',
    title: 'Registre o que você fez',
    description:
      'Chat guiado que coleta sua sessão de trabalho — o que foi feito, como, qual feature, quais dificuldades — e salva tudo estruturado.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    accent: 'violet',
    label: 'Modo Consulta',
    title: 'Consulte seu histórico',
    description:
      'Perguntas fixas que usam busca vetorial semântica (RAG) sobre tudo que você já registrou. Encontre decisões, soluções e contexto em segundos.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
      </svg>
    ),
    accent: 'indigo',
    label: 'Projetos',
    title: 'Organizado por projeto',
    description:
      'Cada sessão fica vinculada a um projeto. Histórico, tarefas e contexto sempre agrupados e prontos para recuperação.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Registre',
    description: 'Conte o que você fez em linguagem natural. A IA faz as perguntas certas.',
  },
  {
    number: '02',
    title: 'Estruture',
    description: 'Cada sessão vira um registro indexado: feature, implementação, dificuldades.',
  },
  {
    number: '03',
    title: 'Consulte',
    description: 'Busque decisões, soluções e contexto do seu histórico técnico a qualquer momento.',
  },
]

export default function Home() {
  return (
    <div className="min-h-svh bg-surface-base text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo wordmark */}
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <img src={icon} alt="LogIA" className="h-7 w-auto" />
            <span className="text-xl leading-none text-white/95 font-['Sora']">
              <span className="font-semibold">Log</span>
              <span className="font-bold tracking-[0.04em] text-accent-violet font-['Space_Grotesk']">IA</span>
            </span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-btn px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/60 uppercase transition-colors duration-150 hover:text-white/90"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-btn bg-gradient-to-r from-accent-indigo via-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24 text-center">
        {/* Video background */}
        <video
          className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundAnimation} type="video/mp4" />
        </video>

        {/* Overlays */}
        <div className="pointer-events-none absolute inset-0 bg-surface-low/60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent,#0A0C10_80%)]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl">
          {/* Full logo */}
          <img
            src={icon}
            alt="LogIA"
            className="h-16 w-auto object-contain drop-shadow-[0_0_32px_rgba(139,92,246,0.4)] sm:h-20"
          />

          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-btn border border-white/10 bg-surface-container/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/50 uppercase backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-violet animate-pulse" />
            Diário Técnico com Inteligência Artificial
          </span>

          {/* Headline */}
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white/95 sm:text-5xl md:text-6xl font-['Space_Grotesk']">
            Registre. Organize.{' '}
            <span className="bg-gradient-to-r from-accent-indigo via-indigo-400 to-accent-violet bg-clip-text text-transparent">
              Consulte.
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
            O diário técnico que aprende com você. Registre sessões de trabalho em linguagem natural e consulte seu histórico com busca semântica.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="rounded-btn bg-gradient-to-r from-accent-indigo via-indigo-500 to-violet-500 px-8 py-3.5 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-[0_0_32px_rgba(99,102,241,0.35)] transition-[filter,transform,box-shadow] duration-150 hover:brightness-110 hover:shadow-[0_0_48px_rgba(99,102,241,0.45)] active:scale-[0.98]"
            >
              Começar grátis
            </Link>
            <Link
              to="/login"
              className="rounded-btn border border-white/12 bg-surface-container/70 px-8 py-3.5 text-xs font-semibold tracking-[0.16em] text-white/70 uppercase backdrop-blur-sm transition-[border-color,color,background-color] duration-150 hover:border-white/20 hover:bg-surface-high/80 hover:text-white/90"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/25">
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="relative bg-surface-base px-5 py-24 sm:px-8">
        {/* Subtle top separator via tonal shift — no border */}
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-accent-violet uppercase">Funcionalidades</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl font-['Sora']">
              Tudo que você precisa, sem ruído
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/45">
              Interface única que alterna entre registro guiado e consulta semântica do seu histórico.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="group relative rounded-card border border-white/8 bg-surface-container p-6 transition-[border-color,background-color] duration-200 hover:border-white/14 hover:bg-surface-high"
              >
                {/* Glow on hover */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${f.accent === 'violet' ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.08),transparent_60%)]' : 'bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_60%)]'}`}
                />

                {/* Icon */}
                <div
                  className={`mb-5 inline-flex items-center justify-center rounded-btn p-2.5 ${f.accent === 'violet' ? 'bg-accent-violet/12 text-accent-violet' : 'bg-accent-indigo/12 text-accent-indigo'}`}
                >
                  {f.icon}
                </div>

                {/* Label */}
                <p className={`mb-2 text-[10px] font-semibold tracking-[0.2em] uppercase ${f.accent === 'violet' ? 'text-accent-violet/80' : 'text-accent-indigo/80'}`}>
                  {f.label}
                </p>

                {/* Title */}
                <h3 className="mb-2 text-base font-semibold text-white/90">{f.title}</h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-white/45">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="bg-surface-low px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-accent-indigo uppercase">Como funciona</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl font-['Sora']">
              Três passos, zero fricção
            </h2>
          </div>

          <div className="relative grid gap-12 sm:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="pointer-events-none absolute top-5 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] hidden h-px bg-gradient-to-r from-accent-indigo/30 via-accent-violet/30 to-accent-indigo/30 sm:block" />

            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                {/* Step number bubble */}
                <div className="relative mb-6 flex h-10 w-10 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet opacity-20 blur-sm" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-surface-container text-xs font-bold tracking-wider text-white/70">
                    {step.number}
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold text-white/90">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/45">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-surface-base px-5 py-28 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white/95 sm:text-4xl font-['Space_Grotesk']">
            Seu histórico técnico,{' '}
            <span className="bg-gradient-to-r from-accent-indigo to-accent-violet bg-clip-text text-transparent">
              sempre acessível.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/45">
            Pare de perder contexto entre sessões. Comece a registrar hoje.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="rounded-btn bg-gradient-to-r from-accent-indigo via-indigo-500 to-violet-500 px-8 py-3.5 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              className="text-xs font-semibold tracking-[0.14em] text-white/40 uppercase transition-colors duration-150 hover:text-white/70"
            >
              Já tenho conta →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 bg-surface-low px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={icon} alt="LogIA" className="h-5 w-auto opacity-60" />
            <span className="text-sm text-white/30 font-['Sora']">
              <span className="font-semibold">Log</span>
              <span className="font-bold text-accent-violet/60 font-['Space_Grotesk']">IA</span>
            </span>
          </div>
          <p className="text-[11px] tracking-[0.1em] text-white/25">
            © {new Date().getFullYear()} LogIA. Seu diário técnico inteligente.
          </p>
        </div>
      </footer>

    </div>
  )
}
