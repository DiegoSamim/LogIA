import type { ChecklistItem, ProjectMemberLookup, TaskRegisterQuestion } from '@/pages/Chat/types'
import ChecklistInput from './ChecklistInput'
import EnumChipSelector from './EnumChipSelector'
import MemberMultiSelect from './MemberMultiSelect'
import StackAutocomplete from '@/components/ui/StackAutocomplete'

interface Props {
  question: TaskRegisterQuestion
  textValue: string
  onTextChange: (value: string) => void
  enumValue: string | null
  onEnumSelect: (value: string) => void
  tagsValue: string[]
  onTagsChange: (tags: string[]) => void
  checklistValue: ChecklistItem[]
  onChecklistChange: (items: ChecklistItem[]) => void
  memberValue: string[]
  memberOptions: ProjectMemberLookup[]
  onMemberToggle: (userId: string) => void
  onSubmit: () => void
  onSkip: () => void
  disabled?: boolean
}

export default function TaskQuestionInput({
  question,
  textValue,
  onTextChange,
  enumValue,
  onEnumSelect,
  tagsValue,
  onTagsChange,
  checklistValue,
  onChecklistChange,
  memberValue,
  memberOptions,
  onMemberToggle,
  onSubmit,
  onSkip,
  disabled,
}: Props) {
  const isText = question.inputType === 'text' || question.inputType === 'textarea'
  const isEnum = question.inputType === 'enum-single'
  const isTags = question.inputType === 'tags'
  const isChecklist = question.inputType === 'checklist'
  const isMemberMulti = question.inputType === 'member-multi'
  const isOptional = !question.required

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!disabled) onSubmit()
        }}
        className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]"
      >
        <div className="flex items-start gap-3">
          {/* ── Left: input content ─────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {isEnum && (
              <EnumChipSelector
                options={question.enumOptions ?? []}
                value={enumValue}
                onSelect={onEnumSelect}
              />
            )}

            {isTags && (
              <StackAutocomplete
                value={tagsValue}
                onChange={onTagsChange}
                placeholder={question.placeholder}
              />
            )}

            {isChecklist && (
              <ChecklistInput
                value={checklistValue}
                onChange={onChecklistChange}
                placeholder={question.placeholder}
              />
            )}

            {isMemberMulti && (
              <MemberMultiSelect
                members={memberOptions}
                selectedIds={memberValue}
                onToggle={onMemberToggle}
              />
            )}

            {isText && (
              <textarea
                rows={1}
                value={textValue}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={question.placeholder}
                className="min-h-12 w-full resize-none overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-3 text-sm leading-6 text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                onKeyDown={handleKeyDown}
              />
            )}
          </div>

          {/* ── Right: actions column ───────────────────────────────── */}
          <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-stretch">
            <button
              type="submit"
              disabled={disabled}
              className="h-11 min-w-24 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              Enviar
            </button>
            {isOptional && (
              <button
                type="button"
                onClick={onSkip}
                className="text-center text-[10px] leading-none text-white/28 underline-offset-2 transition-colors duration-150 hover:text-white/52 hover:underline"
              >
                Pular
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
