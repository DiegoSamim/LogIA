import type { TaskRegisterQuestion } from '@/pages/Chat/types'
import { TASK_STATUS_OPTIONS } from '@/pages/Chat/constants'

export default function TaskQuestionInput({
  question,
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  question: TaskRegisterQuestion
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const isStatus = question.field === 'newStatus'

  return (
    <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!disabled) onSubmit()
        }}
        className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]"
      >
        <div className="flex items-end gap-3">
          {isStatus ? (
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TASK_STATUS_OPTIONS.map((option) => {
                  const selected = value === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange(option.value)}
                      className={[
                        'rounded-[18px] border px-4 py-3 text-left text-sm transition-[border-color,color,background-color] duration-150',
                        selected
                          ? 'border-accent-indigo/40 bg-accent-indigo/10 text-white'
                          : 'border-white/8 bg-surface-base/88 text-white/62 hover:border-white/18 hover:text-white/82',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <textarea
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder}
              className="min-h-11 flex-1 resize-none overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-3 text-sm leading-6 text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!disabled) onSubmit()
                }
              }}
            />
          )}
          <button
            type="submit"
            disabled={disabled}
            className="h-11 min-w-28 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}
