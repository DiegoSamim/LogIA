import { useState, useEffect } from 'react'
import type { ProjectDetailDTO, TaskDTO, TaskCategory } from '@/data/dtos'
import { projectService } from '@/services/project.service'
import { taskService } from '@/services/task.service'
import { useAppStore } from '@/store/useAppStore'

export interface DashboardStats {
  total: number
  todo: number
  in_progress: number
  done: number
  blocked: number
  cancelled: number
}

export interface CategoryCount {
  category: TaskCategory
  count: number
}

export interface DashboardData {
  project: ProjectDetailDTO | null
  stats: DashboardStats
  categoryDistribution: CategoryCount[]
  recentTasks: TaskDTO[]
  activityTasks: TaskDTO[]
  loading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  const currentProject = useAppStore((s) => s.currentProject)

  const [project, setProject] = useState<ProjectDetailDTO | null>(null)
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentProject?.id) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      projectService.get(currentProject.id),
      taskService.listByProject(currentProject.id),
    ])
      .then(([projectRes, tasksRes]) => {
        if (cancelled) return
        setProject(projectRes.data)
        setTasks(tasksRes.data)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os dados do dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentProject?.id])

  const stats: DashboardStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  }

  const categoryMap = new Map<TaskCategory, number>()
  for (const task of tasks) {
    categoryMap.set(task.category, (categoryMap.get(task.category) ?? 0) + 1)
  }
  const categoryDistribution: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const activityTasks = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  return {
    project,
    stats,
    categoryDistribution,
    recentTasks,
    activityTasks,
    loading,
    error,
  }
}
