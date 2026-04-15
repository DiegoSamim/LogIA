import { useRef, useState } from 'react'
import type { AttachmentUploadState } from '@/pages/Chat/types'
import { taskService } from '@/services/task.service'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function getFileType(file: File): 'pdf' | 'image' {
  return file.type === 'application/pdf' ? 'pdf' : 'image'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ type }: { type: 'pdf' | 'image' }) {
  if (type === 'pdf') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-red-400/20 bg-red-400/10">
        <span className="text-[9px] font-bold tracking-wider text-red-300">PDF</span>
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-violet-400/20 bg-violet-400/10">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  )
}

function StatusIcon({ status }: { status: AttachmentUploadState['status'] }) {
  if (status === 'uploading') {
    return (
      <svg className="h-4 w-4 animate-spin text-accent-indigo/60" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  if (status === 'done') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-400">
        <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-red-400">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return null
}

export default function AttachmentUploadStep({
  taskId,
  onComplete,
  onSkip,
}: {
  taskId: string
  onComplete: () => void
  onSkip: () => void
}) {
  const [files, setFiles] = useState<AttachmentUploadState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(entry: AttachmentUploadState) {
    setFiles((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading' } : f))
    )
    try {
      const { data } = await taskService.uploadAttachment(taskId, entry.file)
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'done', url: data.file_url } : f))
      )
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'error' } : f))
      )
    }
  }

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming)
    const valid = arr.filter((f) => {
      if (!ACCEPTED_MIME.includes(f.type)) return false
      if (f.size > MAX_SIZE) return false
      return true
    })

    const entries: AttachmentUploadState[] = valid.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      name: f.name,
      type: getFileType(f),
      size: f.size,
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...entries])
    entries.forEach((e) => { void uploadFile(e) })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const hasPending = files.some((f) => f.status === 'pending' || f.status === 'uploading')
  const doneCount = files.filter((f) => f.status === 'done').length

  return (
    <div className="chat-card-enter mx-1 rounded-[18px] border border-white/8 bg-surface-container/88 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.20)]">
      <div className="mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/40">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
        <p className="text-xs font-semibold text-white/60">Adicionar anexos <span className="font-normal text-white/28">(opcional)</span></p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed py-5 text-center transition-colors duration-150',
          isDragging
            ? 'border-accent-indigo/40 bg-accent-indigo/6'
            : 'border-white/10 bg-surface-base/40 hover:border-white/18 hover:bg-surface-base/60',
        ].join(' ')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-xs text-white/36">Solte PDFs ou imagens aqui</p>
        <p className="text-[10px] text-white/20">ou clique para selecionar · máx. 10 MB por arquivo</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2.5 rounded-[8px] border border-white/6 bg-surface-base/50 px-3 py-2">
              <FileIcon type={f.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-white/76">{f.name}</p>
                <p className="text-[10px] text-white/28">{formatSize(f.size)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusIcon status={f.status} />
                {(f.status === 'pending' || f.status === 'done' || f.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Remover ${f.name}`}
                    className="text-white/20 transition-colors hover:text-white/52"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-[11px] text-white/28 underline-offset-2 transition-colors hover:text-white/52 hover:underline"
        >
          Pular
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={hasPending}
          className="h-9 min-w-24 rounded-[14px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          {doneCount > 0 ? `Concluir (${doneCount})` : 'Concluir →'}
        </button>
      </div>
    </div>
  )
}
