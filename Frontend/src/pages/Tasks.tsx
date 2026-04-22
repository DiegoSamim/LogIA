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
} from '@/components/Tasks'
import {
  EMPTY_TASK_FILTERS,
  type TaskFilterState,
} from '@/components/Tasks/utils'
import { taskService } from '@/services/task.service'
import { useAppStore } from '@/store/useAppStore'

export default function Tasks() {
  const navigate = useNavigate()
  const { currentProject } = useAppStore()
  const projectId = currentProject?.id ?? null

  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskFilterState>(EMPTY_TASK_FILTERS)
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

  return (
    <div className="min-h-full overflow-y-auto bg-surface-base">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="space-y-6">
          <header className="relative overflow-hidden rounded-[28px] border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,rgba(16,18,24,0.98),rgba(10,12,16,1))] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
            <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-accent-violet/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="rounded-full border border-white/8 bg-surface-container/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/34">
                  {filteredTasks.length} exibidas
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2 rounded-[16px] bg-linear-to-r from-accent-indigo to-accent-violet px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.24)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
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
