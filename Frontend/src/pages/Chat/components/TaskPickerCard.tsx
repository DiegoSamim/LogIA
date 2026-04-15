import type { TaskLookup } from '@/pages/Chat/types'
import { getTaskStatusLabel } from '@/pages/Chat/utils'
import LogoAvatar from './LogoAvatar'

export default function TaskPickerCard({
  tasks,
  selectedTaskId,
  onSelect,
  disabled = false,
}: {
  tasks: TaskLookup[]
  selectedTaskId: string | null
  onSelect: (taskId: string) => void
  disabled?: boolean
}) {
  return (
    <div className="chat-card-enter flex items-start gap-4">
      <LogoAvatar />
      <div className="grid max-w-3xl flex-1 grid-cols-1 gap-3">
        {tasks.map((task) => {
          const selected = selectedTaskId === task.id
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelect(task.id)}
              disabled={disabled}
              className={[
                'rounded-[22px] border p-4 text-left transition-[border-color,transform,background-color] duration-150 hover:-translate-y-0.5',
                selected
                  ? 'border-accent-indigo/40 bg-accent-indigo/8'
                  : 'border-white/8 bg-surface-container/88 hover:border-white/16',
                disabled ? 'cursor-not-allowed opacity-55' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/86">{task.title}</p>
                  <p className="mt-1 text-[11px] tracking-[0.16em] text-white/34 uppercase">
                    {getTaskStatusLabel(task.status)}
                  </p>
                </div>
                {selected && (
                  <span className="rounded-full border border-accent-indigo/22 bg-accent-indigo/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase">
                    Selecionada
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
