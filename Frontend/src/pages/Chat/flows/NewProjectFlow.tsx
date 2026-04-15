import { useEffect, useRef, useState } from 'react'
import StackAutocomplete from '@/components/ui/StackAutocomplete'
import StackBadge from '@/components/ui/StackBadge'
import { projectService } from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'
import type { ChatMessageViewModel, NewProjectFlowProps, ProjectDraft, SidePanelSection } from '@/pages/Chat/types'
import { PROJECT_QUESTIONS } from '@/pages/Chat/constants'
import { getProjectDraftValue } from '@/pages/Chat/utils'
import ChatMessage from '@/components/chat/ChatMessage'
import LogoAvatar from '@/components/chat/LogoAvatar'
import SidePanel from '@/components/chat/SidePanel'
import { useNavigate } from 'react-router-dom'

function ProjectSummaryCard({
  draft,
  onConfirm,
  onEdit,
  saving,
}: {
  draft: ProjectDraft
  onConfirm: () => void
  onEdit: () => void
  saving: boolean
}) {
  return (
    <div className="chat-card-enter flex items-start gap-4">
      <LogoAvatar />
      <div className="flex-1 max-w-3xl space-y-4">
        <article className="chat-message-glow rounded-[22px] border border-white/8 bg-surface-container/92 px-5 py-4 sm:px-6">
          <p className="text-[15px] leading-8 text-white/82">Aqui está o resumo do seu projeto. Tudo certo para criar?</p>
        </article>

        <div className="chat-message-glow rounded-[22px] border border-accent-indigo/20 bg-[linear-gradient(180deg,rgba(19,22,36,0.96),rgba(13,15,22,0.96))] px-5 py-5 sm:px-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Nome</p>
              <p className="mt-1.5 text-sm font-semibold text-white/90">{draft.name}</p>
            </div>
            {draft.description && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Descrição</p>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{draft.description}</p>
              </div>
            )}
            {draft.stack.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Stack</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {draft.stack.map((tech) => (
                    <StackBadge key={tech} value={tech} />
                  ))}
                </div>
              </div>
            )}
            {draft.repository_url && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Repositório</p>
                <p className="mt-1.5 text-xs break-all text-accent-indigo/80">{draft.repository_url}</p>
              </div>
            )}
            {draft.goal && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Objetivo</p>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{draft.goal}</p>
              </div>
            )}
            {draft.scope && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Escopo</p>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{draft.scope}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-white/6 pt-5">
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className="flex items-center gap-2 rounded-[14px] bg-linear-to-r from-accent-indigo to-accent-violet px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {saving ? 'Criando...' : 'Confirmar e criar projeto'}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={saving}
              className="rounded-[14px] border border-white/10 bg-surface-high px-5 py-2.5 text-xs font-medium text-white/48 transition-[border-color,color] duration-150 hover:border-white/20 hover:text-white/72 disabled:opacity-50"
            >
              Editar respostas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewProjectFlow({
  userInitials,
  isPanelOpen,
  onTogglePanel,
}: NewProjectFlowProps) {
  const navigate = useNavigate()
  const { setCurrentProject } = useAppStore()
  const [step, setStep] = useState(0)
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    name: '', description: '', stack: [], repository_url: '', goal: '', scope: '',
  })
  const [projectMessages, setProjectMessages] = useState<ChatMessageViewModel[]>([
    {
      id: 'np-0',
      sender: 'assistant' as const,
      tone: 'standard' as const,
      content: PROJECT_QUESTIONS[0].question,
    },
  ])
  const [phase, setPhase] = useState<'questions' | 'summary' | 'saving' | 'done'>('questions')
  const [projectInput, setProjectInput] = useState('')
  const projectTextareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [projectMessages, phase])

  useEffect(() => {
    const el = projectTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [projectInput])

  function handleProjectInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setProjectInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function submitProjectStackAnswer(selected: string[] | null) {
    const value = selected?.filter(Boolean) ?? []
    const userContent = value.length > 0 ? value.join(', ') : '— pulei esta pergunta'

    setProjectMessages((prev) => [
      ...prev,
      { id: `user-${step}`, sender: 'user', tone: 'highlight', content: userContent },
    ])

    const updated = { ...projectDraft, stack: value }
    setProjectDraft(updated)

    const nextStep = step + 1
    if (nextStep < PROJECT_QUESTIONS.length) {
      setStep(nextStep)
      setTimeout(() => {
        setProjectMessages((prev) => [
          ...prev,
          { id: `np-${nextStep}`, sender: 'assistant', tone: 'standard', content: PROJECT_QUESTIONS[nextStep].question },
        ])
      }, 350)
    } else {
      setPhase('summary')
    }
  }

  function submitProjectAnswer(answer: string | null) {
    const currentQ = PROJECT_QUESTIONS[step]
    const value = answer?.trim() ?? ''

    setProjectMessages((prev) => [
      ...prev,
      { id: `user-${step}`, sender: 'user', tone: 'highlight', content: value || '— pulei esta pergunta' },
    ])

    const updated = { ...projectDraft }
    if (currentQ.field === 'stack') {
      updated.stack = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
    } else {
      const field = currentQ.field as Exclude<typeof currentQ.field, 'stack'>
      updated[field] = value
    }
    setProjectDraft(updated)

    setProjectInput('')
    if (projectTextareaRef.current) projectTextareaRef.current.style.height = 'auto'

    const nextStep = step + 1
    if (nextStep < PROJECT_QUESTIONS.length) {
      setStep(nextStep)
      setProjectInput(getProjectDraftValue(updated, PROJECT_QUESTIONS[nextStep].field))
      setTimeout(() => {
        setProjectMessages((prev) => [
          ...prev,
          { id: `np-${nextStep}`, sender: 'assistant', tone: 'standard', content: PROJECT_QUESTIONS[nextStep].question },
        ])
      }, 350)
    } else {
      setPhase('summary')
    }
  }

  async function handleConfirmCreate() {
    setPhase('saving')
    try {
      const { data } = await projectService.create({
        name: projectDraft.name,
        description: projectDraft.description || null,
        repository_url: projectDraft.repository_url || null,
        profile: {
          main_stack: projectDraft.stack,
          goal: projectDraft.goal || null,
          scope: projectDraft.scope || null,
        },
      })
      setCurrentProject({ id: data.id, name: data.name })
      setPhase('done')
      setTimeout(() => navigate(`/projects/${data.id}/sobre`), 900)
    } catch {
      setPhase('summary')
    }
  }

  function handleEditAnswers() {
    setStep(0)
    setProjectMessages([{ id: 'np-0-reset', sender: 'assistant', tone: 'standard', content: PROJECT_QUESTIONS[0].question }])
    setProjectInput(getProjectDraftValue(projectDraft, PROJECT_QUESTIONS[0].field))
    setPhase('questions')
  }

  const currentQ = PROJECT_QUESTIONS[step]
  const panelSections: SidePanelSection[] = [
    {
      title: 'Projeto em construção',
      content: (
        <div className="space-y-3">
          {projectDraft.name && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Nome</p>
              <p className="mt-1 text-xs text-white/80">{projectDraft.name}</p>
            </div>
          )}
          {projectDraft.description && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Descrição</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{projectDraft.description}</p>
            </div>
          )}
          {projectDraft.stack.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Stack</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {projectDraft.stack.map((tech) => (
                  <StackBadge key={tech} value={tech} compact />
                ))}
              </div>
            </div>
          )}
          {!projectDraft.name && (
            <p className="text-xs italic text-white/28">As respostas aparecerão aqui conforme você preenche.</p>
          )}
        </div>
      ),
    },
    {
      title: 'Progresso',
      content: (
        <div className="space-y-2">
          {PROJECT_QUESTIONS.map((question, index) => (
            <div key={question.field} className="flex items-center gap-2.5">
              <span
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                  index < step || phase === 'summary' || phase === 'saving' || phase === 'done'
                    ? 'bg-accent-indigo/80 text-white'
                    : index === step && phase === 'questions'
                    ? 'border border-accent-indigo/60 text-accent-indigo/80'
                    : 'border border-white/12 text-white/24',
                ].join(' ')}
              >
                {index < step || phase !== 'questions' ? '✓' : index + 1}
              </span>
              <span
                className={[
                  'text-[11px]',
                  index === step && phase === 'questions' ? 'text-white/72' : index < step || phase !== 'questions' ? 'text-white/40' : 'text-white/22',
                ].join(' ')}
              >
                {question.field === 'name'
                  ? 'Nome'
                  : question.field === 'description'
                  ? 'Descrição'
                  : question.field === 'stack'
                  ? 'Stack'
                  : question.field === 'repository_url'
                  ? 'Repositório'
                  : question.field === 'goal'
                  ? 'Objetivo'
                  : 'Escopo'}
                {!question.required && <span className="ml-1 text-white/24">(opcional)</span>}
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div ref={scrollRef} className="chat-scroll flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          {projectMessages.map((message) => (
            <ChatMessage key={message.id} message={message} userInitials={userInitials} />
          ))}
          {(phase === 'summary' || phase === 'saving' || phase === 'done') && (
            <ProjectSummaryCard
              draft={projectDraft}
              onConfirm={handleConfirmCreate}
              onEdit={handleEditAnswers}
              saving={phase === 'saving'}
            />
          )}
          {phase === 'done' && (
            <div className="chat-card-enter flex items-start gap-4">
              <LogoAvatar />
              <article className="chat-message-glow rounded-[22px] border border-accent-indigo/24 bg-surface-container/92 px-5 py-4 sm:px-6">
                <p className="text-[15px] leading-8 text-white/82">
                  Projeto criado com sucesso! Redirecionando para os detalhes do projeto...
                </p>
              </article>
            </div>
          )}
        </div>

        {phase === 'questions' && (
          <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
            {currentQ.hint && (
              <p className="mb-2 text-[10px] tracking-[0.16em] text-white/28 uppercase">{currentQ.hint}</p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (currentQ.field === 'stack') {
                  submitProjectStackAnswer(projectDraft.stack)
                  return
                }
                submitProjectAnswer(projectInput)
              }}
              className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]"
            >
              <div className="flex items-end gap-3">
                {currentQ.field === 'stack' ? (
                  <div className="flex-1">
                    <StackAutocomplete
                      value={projectDraft.stack}
                      onChange={(value) => setProjectDraft((current) => ({ ...current, stack: value }))}
                      placeholder={currentQ.placeholder}
                      allowCustom
                    />
                  </div>
                ) : (
                  <textarea
                    ref={projectTextareaRef}
                    rows={1}
                    value={projectInput}
                    onChange={handleProjectInputChange}
                    placeholder={currentQ.placeholder}
                    className="min-h-11 flex-1 resize-none overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-3 text-sm leading-6 text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submitProjectAnswer(projectInput)
                      }
                    }}
                  />
                )}
                <div className="flex shrink-0 items-end gap-2">
                  {!currentQ.required && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentQ.field === 'stack') {
                          submitProjectStackAnswer(null)
                          return
                        }
                        submitProjectAnswer(null)
                      }}
                      className="h-11 rounded-[18px] border border-white/10 bg-surface-high px-4 text-xs font-medium text-white/40 transition-[border-color,color] duration-150 hover:border-white/20 hover:text-white/65"
                    >
                      Pular
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={currentQ.field !== 'stack' && currentQ.required && !projectInput.trim()}
                    className="h-11 min-w-28 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                  >
                    {currentQ.field === 'stack' ? 'Continuar' : 'Enviar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </section>

      <div
        className={[
          'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
          'transition-[width] duration-220 ease-in-out',
          isPanelOpen ? 'w-[288px]' : 'w-10',
        ].join(' ')}
      >
        {isPanelOpen ? (
          <SidePanel sections={panelSections} onClose={() => onTogglePanel(false)} label="Novo projeto" />
        ) : (
          <button
            type="button"
            onClick={() => onTogglePanel(true)}
            aria-label="Abrir painel contextual"
            className="flex flex-1 items-center justify-center text-white/36 transition-colors duration-150 hover:text-white/68"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
