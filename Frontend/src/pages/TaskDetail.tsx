import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { TaskAttachmentDTO, TaskCheckpointDTO, TaskDTO, TaskUpdateDTO, UpdateTaskRequest } from '@/data/dtos'
import { taskService } from '@/services/task.service'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import {
  TaskAttachments,
  TaskCheckpoints,
  TaskDetailContent,
  TaskDetailHeader,
  TaskDetailMeta,
  TaskUpdateTimeline,
} from '@/components/TaskDetail'

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { setCurrentTaskTitle } = useAppStore()

  const [task, setTask] = useState<TaskDTO | null>(null)
  const [updates, setUpdates] = useState<TaskUpdateDTO[]>([])
  const [checkpoints, setCheckpoints] = useState<TaskCheckpointDTO[]>([])
  const [attachments, setAttachments] = useState<TaskAttachmentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setEditing] = useState(false)
  const [draft, setDraft] = useState<UpdateTaskRequest>({})
  const [saving, setSaving] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!taskId) return
    let active = true

    async function loadAll() {
      setLoading(true)
      setError(null)

      try {
        const [taskRes, updatesRes, checkpointsRes, attachmentsRes] = await Promise.all([
          taskService.getById(taskId!),
          taskService.listUpdates(taskId!),
          taskService.listCheckpoints(taskId!),
          taskService.listAttachments(taskId!),
        ])

        if (active) {
          setTask(taskRes.data)
          setUpdates(updatesRes.data)
          setCheckpoints(checkpointsRes.data)
          setAttachments(attachmentsRes.data)
        }
      } catch (err: unknown) {
        if (active) {
          const status = (err as { response?: { status?: number } })?.response?.status
          if (status === 404 || status === 403) {
            setError('Tarefa não encontrada ou você não tem acesso a este recurso.')
          } else {
            setError('Não foi possível carregar a tarefa.')
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadAll()
    return () => { active = false }
  }, [taskId])

  useEffect(() => {
    setCurrentTaskTitle(task?.title ?? null)
    return () => {
      setCurrentTaskTitle(null)
    }
  }, [task?.title, setCurrentTaskTitle])

  function startEdit() {
    if (!task) return
    setDraft({
      title: task.title,
      status: task.status,
      category: task.category,
      priority: task.priority,
      what_was_done: task.what_was_done ?? '',
      technical_approach: task.technical_approach ?? '',
      next_steps: task.next_steps ?? '',
      blocked_reason: task.blocked_reason ?? '',
      people_involved: task.people_involved ?? '',
      tags: task.tags,
      hours_worked: task.hours_worked,
      started_at: task.started_at,
      completed_at: task.completed_at,
      feature_or_ticket: task.feature_or_ticket,
    })
    setEditing(true)
  }

  function cancelEdit() {
    setDraft({})
    setEditing(false)
  }

  async function saveEdit() {
    if (!taskId || !task) return
    setSaving(true)
    try {
      const { data } = await taskService.update(taskId, draft)
      setTask(data)
      setEditing(false)
      setDraft({})
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!taskId) return
    setDeleting(true)
    try {
      await taskService.deleteTask(taskId)
      navigate('/tasks')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleToggleCheckpoint(checkpointId: string, isDone: boolean) {
    if (!taskId) return
    // Optimistic update
    setCheckpoints((prev) =>
      prev.map((c) => (c.id === checkpointId ? { ...c, is_done: isDone } : c)),
    )
    try {
      const { data } = await taskService.toggleCheckpoint(taskId, checkpointId, isDone)
      setCheckpoints((prev) => prev.map((c) => (c.id === checkpointId ? data : c)))
    } catch {
      // Revert on error
      setCheckpoints((prev) =>
        prev.map((c) => (c.id === checkpointId ? { ...c, is_done: !isDone } : c)),
      )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-surface-base">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent-indigo/70" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-surface-base px-4">
        <p className="text-sm text-red-300/70">{error ?? 'Tarefa não encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-xs text-accent-indigo/70 hover:text-accent-indigo/90"
        >
          ← Voltar às tarefas
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface-base">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="space-y-5">
          {/* Header */}
          <TaskDetailHeader
            task={task}
            isEditing={isEditing}
            saving={saving}
            onEdit={startEdit}
            onSave={() => { void saveEdit() }}
            onCancel={cancelEdit}
            onDelete={() => setShowDeleteModal(true)}
            draft={draft}
            onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />

          {/* Body: content + meta panel */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
            {/* Left column — main content */}
            <div className="min-w-0 flex-1 space-y-5">
              <TaskDetailContent
                task={task}
                isEditing={isEditing}
                draft={draft}
                onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
                onEdit={startEdit}
              />

              {/* Checkpoints */}
              <TaskCheckpoints
                taskId={task.id}
                checkpoints={checkpoints}
                onNewCheckpoint={(checkpoint) =>
                  setCheckpoints((prev) =>
                    [...prev, checkpoint].sort((a, b) => a.order_index - b.order_index),
                  )
                }
                onToggle={(id, isDone) => { void handleToggleCheckpoint(id, isDone) }}
              />

              {/* Attachments */}
              <TaskAttachments
                taskId={task.id}
                attachments={attachments}
                onNewAttachment={(a) => setAttachments((prev) => [a, ...prev])}
                onDeleteAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              />

              {/* Update timeline */}
              <TaskUpdateTimeline
                taskId={task.id}
                task={task}
                updates={updates}
                onNewUpdate={(update) => setUpdates((prev) => [update, ...prev])}
                onTaskChange={setTask}
              />
            </div>

            {/* Right panel — meta */}
            <div className="xl:w-72 xl:shrink-0">
              <TaskDetailMeta
                task={task}
                isEditing={isEditing}
                draft={draft}
                onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
                onEdit={startEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        title="Excluir tarefa"
        description="Esta ação não pode ser desfeita. A tarefa e todos os seus dados associados serão removidos permanentemente."
        onClose={() => setShowDeleteModal(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="rounded-card border border-white/10 bg-surface-high/60 px-4 py-2 text-sm font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => { void handleDelete() }}
              disabled={deleting}
              className="flex items-center gap-2 rounded-card bg-red-500/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(239,68,68,0.2)] transition-[filter,opacity] duration-150 hover:brightness-110 disabled:opacity-50"
            >
              {deleting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-white/80" />
              ) : null}
              Excluir
            </button>
          </>
        }
      />
    </div>
  )
}
