import { useRef, useState } from 'react'
import type { TaskAttachmentDTO } from '@/data/dtos'
import AttachmentPreviewModal from '@/components/ui/AttachmentPreviewModal'
import { taskService } from '@/services/task.service'
import { buildFileUrl } from '@/services/api'

interface Props {
  taskId: string
  attachments: TaskAttachmentDTO[]
  canEdit: boolean
  onNewAttachment: (a: TaskAttachmentDTO) => void
  onDeleteAttachment: (id: string) => void
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(attachment: TaskAttachmentDTO): boolean {
  return (
    attachment.file_type === 'image' ||
    (attachment.mime_type?.startsWith('image/') ?? false)
  )
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-white/24">
      <rect x="4" y="2" width="16" height="22" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 8h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 2v6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TaskAttachments({
  taskId,
  attachments,
  canEdit,
  onNewAttachment,
  onDeleteAttachment,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachmentDTO | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data } = await taskService.uploadAttachment(taskId, file)
      onNewAttachment(data)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId)
    try {
      await taskService.deleteAttachment(taskId, attachmentId)
      onDeleteAttachment(attachmentId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
          Arquivos e imagens
        </p>
        <span className="text-[11px] tabular-nums text-white/30">
          {attachments.length} {attachments.length === 1 ? 'arquivo' : 'arquivos'}
        </span>
      </div>

      {/* Upload zone */}
      {canEdit && (
        <div className="mt-4">
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/10 py-4 text-sm text-white/34 transition-[border-color,color,background-color] duration-150 hover:border-accent-indigo/36 hover:bg-accent-indigo/4 hover:text-white/58 ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border border-white/14 border-t-white/60" />
              Enviando...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 9V2M4 5l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Adicionar arquivo
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept="application/pdf,text/plain,image/*"
            onChange={(e) => { void handleUpload(e) }}
            disabled={uploading}
          />
        </label>
        </div>
      )}

      {/* Grid */}
      {attachments.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative overflow-hidden rounded-[14px] border border-white/7 bg-surface-container/50"
            >
              {isImage(att) ? (
                /* Image thumbnail */
                <>
                  <img
                    src={buildFileUrl(att.file_url)}
                    alt={att.file_name}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    {canEdit && (
                      <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { void handleDelete(att.id) }}
                        disabled={deletingId === att.id}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/60 backdrop-blur-sm transition-[color] hover:text-red-300"
                        aria-label="Remover"
                      >
                        {deletingId === att.id ? (
                          <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/60" />
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="self-start rounded-[6px] bg-black/60 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm"
                    >
                      Visualizar
                    </button>
                  </div>
                </>
              ) : (
                /* Document card */
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <FileIcon />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => { void handleDelete(att.id) }}
                        disabled={deletingId === att.id}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/8 bg-surface-high/60 text-white/30 opacity-0 transition-[opacity,color] duration-150 group-hover:opacity-100 hover:text-red-300"
                        aria-label="Remover"
                      >
                        {deletingId === att.id ? (
                          <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/60" />
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-white/70">{att.file_name}</p>
                    <p className="mt-0.5 text-[10px] text-white/28">{formatFileSize(att.file_size)}</p>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="flex items-center gap-1 text-accent-indigo/60 transition-[color] duration-150 hover:text-accent-indigo/90"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 5s1.5-2.5 4-2.5S9 5 9 5 7.5 7.5 5 7.5 1 5 1 5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="5" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Visualizar
                    </button>
                    <a
                      href={buildFileUrl(att.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-white/42 transition-[color] duration-150 hover:text-white/74"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 1h6v6M9 1 4.5 5.5M1 3.5V9h5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Nova aba
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-white/18">Nenhum arquivo anexado</p>
      )}

      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  )
}
