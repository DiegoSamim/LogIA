import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ChatMode } from '@/data/dtos'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { useChatUiStore } from '@/store/useChatUiStore'
import { useAppStore } from '@/store/useAppStore'
import NewProjectFlow from '@/pages/Chat/flows/NewProjectFlow'
import RegularChatFlow from '@/pages/Chat/flows/RegularChatFlow'
import TaskRegisterFlow from '@/pages/Chat/flows/TaskRegisterFlow'
import { canEditProjectRole } from '@/lib/permissions'
import { projectService } from '@/services/project.service'
import './Chat.css'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const isNewProject = searchParams.get('intent') === 'new-project'
  const { initials, avatarUrl } = useAuthProfile()
  const { mode, setMode } = useChatUiStore()
  const { currentProject, setCurrentProject } = useAppStore()
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const userInitials = initials || 'U'
  const canRegister = isNewProject || canEditProjectRole(currentProject?.current_user_role)
  const canQuery = Boolean(currentProject?.id)

  useEffect(() => {
    if (isNewProject || !currentProject?.id || currentProject.current_user_role) return
    projectService.get(currentProject.id).then(({ data }) => {
      setCurrentProject({ id: data.id, name: data.name, current_user_role: data.current_user_role })
    }).catch(() => undefined)
  }, [currentProject?.current_user_role, currentProject?.id, isNewProject, setCurrentProject])

  useEffect(() => {
    if (!isNewProject && mode === 'register' && !canRegister && canQuery) {
      setMode('query')
    }
  }, [canQuery, canRegister, isNewProject, mode, setMode])

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
                      disabled={value === 'register' && !canRegister}
                      className={[
                        'rounded-full px-3.5 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-[background-color,color,box-shadow,transform] duration-200 sm:px-4',
                        active ? 'chat-toggle-active bg-linear-to-r from-accent-indigo to-accent-violet text-white' : 'text-white/40 hover:text-white/72',
                        value === 'register' && !canRegister ? 'cursor-not-allowed opacity-35 hover:text-white/40' : '',
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
                userAvatarUrl={avatarUrl}
                isPanelOpen={isPanelOpen}
                onTogglePanel={setIsPanelOpen}
              />
            ) : mode === 'register' && canRegister ? (
              <TaskRegisterFlow
                projectId={currentProject?.id ?? null}
                projectName={currentProject?.name ?? null}
                userInitials={userInitials}
                userAvatarUrl={avatarUrl}
                isPanelOpen={isPanelOpen}
                onTogglePanel={setIsPanelOpen}
              />
            ) : (
              <RegularChatFlow
                projectId={currentProject?.id ?? null}
                projectName={currentProject?.name ?? null}
                userInitials={userInitials}
                userAvatarUrl={avatarUrl}
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
