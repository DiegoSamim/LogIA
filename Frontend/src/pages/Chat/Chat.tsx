import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ChatMode } from '@/data/dtos'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { useChatUiStore } from '@/store/useChatUiStore'
import { useAppStore } from '@/store/useAppStore'
import NewProjectFlow from '@/pages/Chat/flows/NewProjectFlow'
import RegularChatFlow from '@/pages/Chat/flows/RegularChatFlow'
import TaskRegisterFlow from '@/pages/Chat/flows/TaskRegisterFlow'
import './Chat.css'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const isNewProject = searchParams.get('intent') === 'new-project'
  const { initials } = useAuthProfile()
  const { mode, setMode } = useChatUiStore()
  const { currentProject } = useAppStore()
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const userInitials = initials || 'U'

  return (
    <div className="chat-shell relative h-full overflow-hidden bg-surface-base">
      <div className="relative z-10 flex h-full min-h-0 flex-col px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1520px] flex-col gap-3">
          {!isNewProject && (
            <div className="chat-card-enter flex justify-center md:hidden">
              <div className="chat-toggle-pill inline-flex rounded-full border border-white/8 bg-surface-container/72 p-1">
                {(['register', 'query'] as ChatMode[]).map((value) => {
                  const active = mode === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={[
                        'rounded-full px-3.5 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-[background-color,color,box-shadow,transform] duration-200 sm:px-4',
                        active ? 'chat-toggle-active bg-linear-to-r from-accent-indigo to-accent-violet text-white' : 'text-white/40 hover:text-white/72',
                      ].join(' ')}
                    >
                      {value === 'register' ? 'Registro' : 'Consulta'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 gap-3">
            {isNewProject ? (
              <NewProjectFlow
                userInitials={userInitials}
                isPanelOpen={isPanelOpen}
                onTogglePanel={setIsPanelOpen}
              />
            ) : mode === 'register' ? (
              <TaskRegisterFlow
                projectId={currentProject?.id ?? null}
                projectName={currentProject?.name ?? null}
                userInitials={userInitials}
                isPanelOpen={isPanelOpen}
                onTogglePanel={setIsPanelOpen}
              />
            ) : (
              <RegularChatFlow
                userInitials={userInitials}
                isPanelOpen={isPanelOpen}
                onTogglePanel={setIsPanelOpen}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
