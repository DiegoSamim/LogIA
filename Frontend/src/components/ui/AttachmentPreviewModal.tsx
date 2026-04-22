import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { buildFileUrl } from '@/services/api'

type AttachmentPreviewItem = {
  id: string
  file_name: string
  file_url: string
  mime_type: string | null
  file_type: string | null
}

interface Props {
  attachment: AttachmentPreviewItem | null
  onClose: () => void
}

function isImage(attachment: AttachmentPreviewItem): boolean {
  return attachment.file_type === 'image' || (attachment.mime_type?.startsWith('image/') ?? false)
}

function isPdf(attachment: AttachmentPreviewItem): boolean {
  return (
    attachment.file_type === 'pdf' ||
    attachment.mime_type === 'application/pdf' ||
    attachment.file_name.toLowerCase().endsWith('.pdf')
  )
}

function isText(attachment: AttachmentPreviewItem): boolean {
  return (
    attachment.file_type === 'text' ||
    attachment.mime_type === 'text/plain' ||
    attachment.mime_type?.startsWith('text/') === true ||
    attachment.file_name.toLowerCase().endsWith('.txt')
  )
}

export default function AttachmentPreviewModal({ attachment, onClose }: Props) {
  const [textContent, setTextContent] = useState('')
  const [loadingText, setLoadingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)

  const fileUrl = useMemo(
    () => (attachment ? buildFileUrl(attachment.file_url) : ''),
    [attachment],
  )

  useEffect(() => {
    if (!attachment || !isText(attachment)) {
      setTextContent('')
      setLoadingText(false)
      setTextError(null)
      return
    }

    const controller = new AbortController()

    async function loadTextPreview() {
      setLoadingText(true)
      setTextError(null)

      try {
        const response = await fetch(fileUrl, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Falha ao carregar o arquivo de texto.')
        }
        setTextContent(await response.text())
      } catch (error) {
        if (controller.signal.aborted) return
        setTextError(error instanceof Error ? error.message : 'Falha ao carregar o preview.')
        setTextContent('')
      } finally {
        if (!controller.signal.aborted) {
          setLoadingText(false)
        }
      }
    }

    void loadTextPreview()

    return () => controller.abort()
  }, [attachment, fileUrl])

  if (!attachment) return null

  return (
    <Modal
      open={Boolean(attachment)}
      title={attachment.file_name}
      onClose={onClose}
      eyebrow={null}
      panelClassName="max-w-5xl"
      headerClassName="py-4"
      bodyClassName="min-h-0"
      footer={
        <>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[12px] border border-white/10 bg-surface-high/60 px-4 py-2 text-sm font-medium text-white/72 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/92"
          >
            Abrir em nova aba
          </a>
          <a
            href={fileUrl}
            download={attachment.file_name}
            className="rounded-[12px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2 text-sm font-semibold text-white transition-[filter] duration-150 hover:brightness-110"
          >
            Download
          </a>
        </>
      }
    >
      {isImage(attachment) ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[20px] border border-white/8 bg-surface-base/54 p-3">
          <img
            src={fileUrl}
            alt={attachment.file_name}
            className="max-h-[70vh] w-auto max-w-full rounded-[16px] object-contain"
          />
        </div>
      ) : isPdf(attachment) ? (
        <div className="overflow-hidden rounded-[20px] border border-white/8 bg-surface-base/54">
          <iframe
            src={fileUrl}
            title={attachment.file_name}
            className="h-[70vh] w-full"
          />
        </div>
      ) : isText(attachment) ? (
        <div className="overflow-hidden rounded-[20px] border border-white/8 bg-surface-base/54">
          {loadingText ? (
            <div className="flex h-[60vh] items-center justify-center text-sm text-white/48">
              Carregando preview do arquivo...
            </div>
          ) : textError ? (
            <div className="flex h-[60vh] items-center justify-center px-6 text-center text-sm text-rose-200/80">
              {textError}
            </div>
          ) : (
            <pre className="h-[60vh] overflow-auto px-5 py-4 font-mono text-xs leading-6 text-white/78 whitespace-pre-wrap break-words">
              {textContent || 'Arquivo vazio.'}
            </pre>
          )}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-surface-base/44 px-6 text-center text-sm leading-6 text-white/46">
          Preview inline indisponível para este formato.
        </div>
      )}
    </Modal>
  )
}
