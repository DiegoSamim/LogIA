import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useDashboardData } from '@/pages/Dashboard/hooks/useDashboardData'
import DashboardSection from '@/components/Sobre/DashboardSection'
import DashboardStatsRow from '@/pages/Dashboard/components/DashboardStatsRow'
import DashboardActivityFeed from '@/pages/Dashboard/components/DashboardActivityFeed'
import DashboardTechStack from '@/pages/Dashboard/components/DashboardTechStack'
import DashboardCategoryChart from '@/pages/Dashboard/components/DashboardCategoryChart'
import DashboardRecentTasks from '@/pages/Dashboard/components/DashboardRecentTasks'
import DashboardProjectLinks from '@/pages/Dashboard/components/DashboardProjectLinks'
import DashboardHoursCard from '@/pages/Dashboard/components/DashboardHoursCard'

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[10px] bg-surface-container ${className}`} />
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <SkeletonBlock className="h-80" />
        <div className="space-y-4">
          <SkeletonBlock className="h-36" />
          <SkeletonBlock className="h-40" />
        </div>
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const currentProject = useAppStore((s) => s.currentProject)
  const { project, stats, categoryDistribution, hoursStats, recentTasks, activityTasks, loading, error } =
    useDashboardData()

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-white/40">Nenhum projeto selecionado.</p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="rounded-[6px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          Selecionar projeto
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-orange-300">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm text-white/40 underline underline-offset-2 hover:text-white/70"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const techStack = project?.profile?.main_stack ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/28">
          Project Dashboard
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white/92">
          {project?.name ?? currentProject.name}
        </h1>
        {project?.description && (
          <p className="mt-1 text-sm text-white/40 line-clamp-1">{project.description}</p>
        )}
      </div>

      {/* Stats row */}
      <DashboardStatsRow stats={stats} />

      {/* Main grid: activity + side panels */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* Left: activity feed */}
        <DashboardSection title="Timeline de Atividades Recentes">
          <DashboardActivityFeed tasks={activityTasks} />
        </DashboardSection>

        {/* Right column */}
        <div className="space-y-4">
          <DashboardSection title="Tecnologias Usadas">
            <DashboardTechStack stack={techStack} />
          </DashboardSection>

          <DashboardSection title="Horas Trabalhadas">
            <DashboardHoursCard hours={hoursStats} />
          </DashboardSection>

          <DashboardSection title="Distribuição por Categoria">
            <DashboardCategoryChart distribution={categoryDistribution} />
          </DashboardSection>
        </div>
      </div>

      {/* Recent tasks */}
      <DashboardSection
        title="Tasks Recentes"
        badge={
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="text-[11px] text-accent-indigo/70 transition-colors hover:text-accent-indigo"
          >
            Ver todas →
          </button>
        }
      >
        <DashboardRecentTasks tasks={recentTasks} />
      </DashboardSection>

      {/* Project links — renders only when at least one link exists */}
      {project?.profile && (
        <DashboardSection title="Links do Projeto">
          <DashboardProjectLinks profile={project.profile} repositoryUrl={project.repository_url} />
        </DashboardSection>
      )}
    </div>
  )
}
