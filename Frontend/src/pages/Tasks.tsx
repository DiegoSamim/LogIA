import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import type { TaskDTO, TaskStatus } from '@/data/dtos'

const STATUS_DOT_COLOR: Record<TaskStatus, string> = {
  todo:        '#94A3B8',
  in_progress: '#FCD34D',
  done:        '#6EE7B7',
  blocked:     '#FDBA74',
  cancelled:   '#FDA4AF',
}

const STATUS_DOT_GLOW: Record<TaskStatus, string> = {
  todo:        '0 0 0 4px rgba(148,163,184,0.13)',
  in_progress: '0 0 0 4px rgba(252,211,77,0.15)',
  done:        '0 0 0 4px rgba(110,231,183,0.16)',
  blocked:     '0 0 0 4px rgba(253,186,116,0.16)',
  cancelled:   '0 0 0 4px rgba(253,164,175,0.14)',
}
import {
  TaskCard,
  TaskFiltersBar,
  TaskStatsBar,
  TasksEmptyState,
  TasksKanban,
} from '@/components/Tasks'
import { canEditProjectRole } from '@/lib/permissions'
import {
  EMPTY_TASK_FILTERS,
  type TaskFilterState,
} from '@/components/Tasks/utils'
import { taskService } from '@/services/task.service'
import { projectService } from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'

export default function Tasks() {
  const navigate = useNavigate()
  const { currentProject, setCurrentProject } = useAppStore()
  const projectId = currentProject?.id ?? null
  const canEditProject = canEditProjectRole(currentProject?.current_user_role)

  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskFilterState>(EMPTY_TASK_FILTERS)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline')
  const visibleTasks = useMemo(() => (projectId ? tasks : []), [projectId, tasks])

  useEffect(() => {
    if (!projectId) return
    const activeProjectId = projectId

    let active = true

    async function loadTasks() {
      setLoading(true)
      setError(null)

      try {
        const { data } = await taskService.listByProject(activeProjectId)
        if (active) {
          setTasks(data)
        }
      } catch {
        if (active) {
          setError('Não foi possível carregar as tarefas.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTasks()

    return () => {
      active = false
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId || currentProject?.current_user_role) return
    projectService.get(projectId).then(({ data }) => {
      setCurrentProject({ id: data.id, name: data.name, current_user_role: data.current_user_role })
    }).catch(() => undefined)
  }, [currentProject?.current_user_role, projectId, setCurrentProject])

  const availableStacks = useMemo(
    () =>
      Array.from(
        new Set(
          visibleTasks
            .flatMap((task) => task.tags)
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [visibleTasks],
  )

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    const fromDate = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null
    const toDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null

    return [...visibleTasks]
      .filter((task) => (filters.statuses.length ? filters.statuses.includes(task.status) : true))
      .filter((task) => (filters.categories.length ? filters.categories.includes(task.category) : true))
      .filter((task) => (filters.priorities.length ? (task.priority ? filters.priorities.includes(task.priority) : false) : true))
      .filter((task) => (filters.stacks.length ? filters.stacks.every((tag) => task.tags.includes(tag)) : true))
      .filter((task) => {
        const createdAt = new Date(task.created_at).getTime()
        if (fromDate && createdAt < fromDate) return false
        if (toDate && createdAt > toDate) return false
        return true
      })
      .filter((task) => {
        if (!query) return true

        const title = task.title.toLowerCase()
        const ticket = task.feature_or_ticket?.toLowerCase() ?? ''
        const description = task.what_was_done?.toLowerCase() ?? ''
        const tags = task.tags.join(' ').toLowerCase()

        return (
          title.includes(query) ||
          ticket.includes(query) ||
          description.includes(query) ||
          tags.includes(query)
        )
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [visibleTasks, search, filters])

  const stats = useMemo(
    () => ({
      total: visibleTasks.length,
      done: visibleTasks.filter((task) => task.status === 'done').length,
      in_progress: visibleTasks.filter((task) => task.status === 'in_progress').length,
      blocked: visibleTasks.filter((task) => task.status === 'blocked').length,
    }),
    [visibleTasks],
  )

  const hasActiveFilters = Boolean(
    search.trim() ||
    filters.statuses.length ||
    filters.categories.length ||
    filters.priorities.length ||
    filters.stacks.length ||
    filters.dateFrom ||
    filters.dateTo,
  )

  function clearFilters() {
    setSearch('')
    setFilters(EMPTY_TASK_FILTERS)
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    if (!canEditProject) return
    const prev = tasks.find((t) => t.id === taskId)
    if (!prev) return

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    )

    try {
      const { data } = await taskService.update(taskId, { status: newStatus })
      setTasks((current) => current.map((t) => (t.id === taskId ? data : t)))
    } catch {
      setTasks((current) => current.map((t) => (t.id === taskId ? prev : t)))
    }
  }

  return (
    <div className="min-h-full overflow-y-auto bg-surface-base">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="space-y-6">
          <header className="relative overflow-hidden rounded-[28px] border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,rgba(16,18,24,0.98),rgba(10,12,16,1))] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
            <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-accent-violet/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-indigo/72">
                  Task management
                </p>
                <p className="mt-3 text-sm font-medium text-white/36">
                  {currentProject ? 'Projeto selecionado' : 'Nenhum projeto selecionado'}
                </p>
                <h1 className="mt-1  text-3xl font-semibold tracking-tight text-white/96 sm:text-5xl">
                  {currentProject?.name ?? 'Selecione um projeto'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/42">
                  Últimos registros e andamento das tarefas documentadas para este projeto.
                </p>
              </div>

              <div className="flex shrink-0 items-start">
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  disabled={!canEditProject}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(99,102,241,0.22)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Registrar nova tarefa
                </button>
              </div>
            </div>
          </header>

          <TaskFiltersBar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onApplyFilters={setFilters}
            onClearFilters={clearFilters}
            availableStacks={availableStacks}
          />

          {!loading && visibleTasks.length > 0 ? <TaskStatsBar stats={stats} /> : null}

          {!loading && filteredTasks.length > 0 ? (
            <div className="flex items-center justify-end gap-1 rounded-[8px] border border-white/6 bg-surface-container/60 p-1 self-end w-fit ml-auto">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                title="Linha do tempo"
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-[6px] transition-[background-color,color] duration-150',
                  viewMode === 'timeline'
                    ? 'bg-surface-high text-white/82'
                    : 'text-white/32 hover:text-white/58',
                ].join(' ')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="2.5" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="2.5" cy="7" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="2.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
                  <line x1="5.5" y1="3.5" x2="12" y2="3.5" />
                  <line x1="5.5" y1="7" x2="12" y2="7" />
                  <line x1="5.5" y1="10.5" x2="12" y2="10.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                title="Board Kanban"
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-[6px] transition-[background-color,color] duration-150',
                  viewMode === 'kanban'
                    ? 'bg-surface-high text-white/82'
                    : 'text-white/32 hover:text-white/58',
                ].join(' ')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="3.5" height="12" rx="1" />
                  <rect x="5.25" y="1" width="3.5" height="8" rx="1" />
                  <rect x="9.5" y="1" width="3.5" height="10" rx="1" />
                </svg>
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-white/6 bg-surface-container/52 py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent-indigo/70" />
            </div>
          ) : error ? (
            <div className="rounded-[18px] border border-red-400/14 bg-red-400/6 px-4 py-3 text-sm text-red-200/80">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <TasksEmptyState
              hasProject={Boolean(currentProject)}
              hasFilters={hasActiveFilters}
              onGoToChat={() => navigate('/chat')}
              onClearFilters={clearFilters}
            />
          ) : viewMode === 'kanban' ? (
            <TasksKanban
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              canEdit={canEditProject}
            />
          ) : (
            <section className="rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(15,17,22,0.98),rgba(10,12,16,0.98))] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-4">
              <div>
                <Timeline
                  sx={{
                    m: 0,
                    p: 0,
                    [`& .MuiTimelineItem-root:before`]: {
                      display: 'none',
                    },
                  }}
                >
                  {filteredTasks.map((task, index) => (
                    <TimelineItem key={task.id} sx={{ minHeight: 'unset', alignItems: 'center' }}>
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{
                            m: 0,
                            width: 14,
                            height: 14,
                            p: 0,
                            flexShrink: 0,
                            backgroundColor: STATUS_DOT_COLOR[task.status],
                            borderColor: STATUS_DOT_COLOR[task.status],
                            boxShadow: STATUS_DOT_GLOW[task.status],
                          }}
                        />
                        {index < filteredTasks.length - 1 ? (
                          <TimelineConnector
                            sx={{
                              width: '2px',
                              minHeight: 26,
                              borderRadius: '999px',
                              background:
                                'linear-gradient(180deg,rgba(99,102,241,0.28),rgba(255,255,255,0.06))',
                            }}
                          />
                        ) : null}
                      </TimelineSeparator>

                      <TimelineContent
                        sx={{
                          py: 0,
                          pr: 0,
                          pl: { xs: 2.5, sm: 3 },
                          mb: index < filteredTasks.length - 1 ? 1.5 : 0,
                          minWidth: 0,
                          width: '100%',
                        }}
                      >
                        <TaskCard task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
