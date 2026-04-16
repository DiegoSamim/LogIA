import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import type { TaskCategory, TaskPriority, TaskStatus } from '@/data/dtos'
import Modal from '@/components/ui/Modal'
import {
  CATEGORY_CHIP_OPTIONS,
  PRIORITY_CHIP_OPTIONS,
  STATUS_CHIP_OPTIONS,
} from '@/pages/Chat/constants'
import {
  EMPTY_TASK_FILTERS,
  type TaskFilterState,
} from './utils'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  filters: TaskFilterState
  onApplyFilters: (value: TaskFilterState) => void
  onClearFilters: () => void
  availableStacks: string[]
}

function toggleValue<T>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value]
}

function FilterBadge({
  label,
  active,
  className,
  onClick,
}: {
  label: string
  active: boolean
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[border-color,background-color,color] duration-150',
        active
          ? className
          : 'border-white/8 bg-surface-base/70 text-white/42 hover:border-white/14 hover:text-white/72',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function AppliedChip({
  label,
  toneClass,
  onRemove,
}: {
  label: string
  toneClass: string
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${toneClass}`}
    >
      <span>{label}</span>
      <span className="opacity-60">×</span>
    </button>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
        {title}
      </p>
      {children}
    </section>
  )
}

export default function TaskFiltersBar({
  search,
  onSearchChange,
  filters,
  onApplyFilters,
  onClearFilters,
  availableStacks,
}: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TaskFilterState>(filters)

  const appliedFilterCount = useMemo(
    () =>
      filters.statuses.length +
      filters.categories.length +
      filters.priorities.length +
      filters.stacks.length +
      (filters.dateFrom ? 1 : 0) +
      (filters.dateTo ? 1 : 0),
    [filters],
  )

  function openModal() {
    setDraft(filters)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setDraft(filters)
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/24"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por tarefa, ticket ou stack..."
              className="w-full rounded-[18px] border border-white/8 bg-surface-container/80 py-3 pl-11 pr-11 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/28 transition-colors duration-150 hover:text-white/68"
                aria-label="Limpar busca"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-surface-container/74 px-4 py-3 text-sm font-medium text-white/78 transition-[border-color,background-color] duration-150 hover:border-white/18 hover:bg-surface-high/78"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h18" />
                <path d="M6 12h12" />
                <path d="M10 19h4" />
              </svg>
              Filtro
              {appliedFilterCount > 0 ? (
                <span className="rounded-full border border-accent-indigo/16 bg-accent-indigo/10 px-2 py-0.5 text-[10px] text-accent-indigo/82">
                  {appliedFilterCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-[16px] border border-white/10 bg-surface-container/62 px-4 py-3 text-sm font-medium text-white/52 transition-[border-color,color,background-color] duration-150 hover:border-white/18 hover:bg-surface-high/76 hover:text-white/84"
            >
              Limpar
            </button>
          </div>
        </div>

        {(search.trim() || appliedFilterCount > 0) ? (
          <div className="flex flex-wrap gap-2">
            {search.trim() ? (
              <AppliedChip
                label={`Busca: ${search.trim()}`}
                toneClass="border-accent-indigo/16 bg-accent-indigo/8 text-accent-indigo/82"
                onRemove={() => onSearchChange('')}
              />
            ) : null}

            {filters.statuses.map((value) => {
              const option = STATUS_CHIP_OPTIONS.find((item) => item.value === value)
              return (
                <AppliedChip
                  key={value}
                  label={option?.label ?? value}
                  toneClass={option?.colorClass ?? 'border-white/10 bg-white/5 text-white/72'}
                  onRemove={() =>
                    onApplyFilters({
                      ...filters,
                      statuses: filters.statuses.filter((item) => item !== value),
                    })
                  }
                />
              )
            })}

            {filters.categories.map((value) => {
              const option = CATEGORY_CHIP_OPTIONS.find((item) => item.value === value)
              return (
                <AppliedChip
                  key={value}
                  label={option?.label ?? value}
                  toneClass={option?.colorClass ?? 'border-white/10 bg-white/5 text-white/72'}
                  onRemove={() =>
                    onApplyFilters({
                      ...filters,
                      categories: filters.categories.filter((item) => item !== value),
                    })
                  }
                />
              )
            })}

            {filters.priorities.map((value) => {
              const option = PRIORITY_CHIP_OPTIONS.find((item) => item.value === value)
              return (
                <AppliedChip
                  key={value}
                  label={option?.label ?? value}
                  toneClass={option?.colorClass ?? 'border-white/10 bg-white/5 text-white/72'}
                  onRemove={() =>
                    onApplyFilters({
                      ...filters,
                      priorities: filters.priorities.filter((item) => item !== value),
                    })
                  }
                />
              )
            })}

            {filters.stacks.map((value) => (
              <AppliedChip
                key={value}
                label={value}
                toneClass="border-accent-indigo/16 bg-accent-indigo/8 text-accent-indigo/82"
                onRemove={() =>
                  onApplyFilters({
                    ...filters,
                    stacks: filters.stacks.filter((item) => item !== value),
                  })
                }
              />
            ))}

            {filters.dateFrom ? (
              <AppliedChip
                label={`De ${filters.dateFrom}`}
                toneClass="border-white/10 bg-surface-container/72 text-white/72"
                onRemove={() => onApplyFilters({ ...filters, dateFrom: '' })}
              />
            ) : null}

            {filters.dateTo ? (
              <AppliedChip
                label={`Até ${filters.dateTo}`}
                toneClass="border-white/10 bg-surface-container/72 text-white/72"
                onRemove={() => onApplyFilters({ ...filters, dateTo: '' })}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      <Modal
        open={open}
        title="Filtros da timeline"
        description="Selecione os filtros que deseja aplicar. As alterações só entram em vigor quando você salvar."
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDraft(EMPTY_TASK_FILTERS)}
              className="rounded-[14px] border border-white/10 bg-surface-high/70 px-4 py-2.5 text-sm font-medium text-white/56 transition-[border-color,color] duration-150 hover:border-white/16 hover:text-white/84"
            >
              Resetar
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[14px] border border-white/10 bg-surface-container/74 px-4 py-2.5 text-sm font-medium text-white/68 transition-[border-color,color] duration-150 hover:border-white/16 hover:text-white/88"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyFilters(draft)
                setOpen(false)
              }}
              className="rounded-[14px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Aplicar filtros
            </button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Status">
            <div className="flex flex-wrap gap-2">
              {STATUS_CHIP_OPTIONS.map((option) => (
                <FilterBadge
                  key={option.value}
                  label={option.label}
                  className={option.colorClass}
                  active={draft.statuses.includes(option.value as TaskStatus)}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      statuses: toggleValue(current.statuses, option.value as TaskStatus),
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="Prioridade">
            <div className="flex flex-wrap gap-2">
              {PRIORITY_CHIP_OPTIONS.map((option) => (
                <FilterBadge
                  key={option.value}
                  label={option.label}
                  className={option.colorClass}
                  active={draft.priorities.includes(option.value as TaskPriority)}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      priorities: toggleValue(current.priorities, option.value as TaskPriority),
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="Categoria">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_CHIP_OPTIONS.map((option) => (
                <FilterBadge
                  key={option.value}
                  label={option.label}
                  className={option.colorClass}
                  active={draft.categories.includes(option.value as TaskCategory)}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      categories: toggleValue(current.categories, option.value as TaskCategory),
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="Stack">
            <Autocomplete
              multiple
              options={availableStacks}
              value={draft.stacks}
              onChange={(_, nextValue) =>
                setDraft((current) => ({ ...current, stacks: nextValue }))
              }
              filterSelectedOptions
              disableCloseOnSelect
              popupIcon={null}
              noOptionsText="Nenhuma stack disponível"
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))',
                    boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
                    color: 'rgba(255,255,255,0.88)',
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecione stacks"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      backgroundColor: 'rgba(10,12,16,0.78)',
                      color: 'rgba(255,255,255,0.86)',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.08)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.14)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(99,102,241,0.38)',
                        boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'rgba(255,255,255,0.86)',
                      fontSize: '0.875rem',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(255,255,255,0.24)',
                      opacity: 1,
                    },
                  }}
                />
              )}
            />
          </Section>

          <Section title="Período inicial">
            <input
              type="date"
              value={draft.dateFrom}
              onChange={(event) =>
                setDraft((current) => ({ ...current, dateFrom: event.target.value }))
              }
              className="w-full rounded-[16px] border border-white/8 bg-surface-base/82 px-4 py-3 text-sm text-white/82 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent-indigo/36 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            />
          </Section>

          <Section title="Período final">
            <input
              type="date"
              value={draft.dateTo}
              onChange={(event) =>
                setDraft((current) => ({ ...current, dateTo: event.target.value }))
              }
              className="w-full rounded-[16px] border border-white/8 bg-surface-base/82 px-4 py-3 text-sm text-white/82 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent-indigo/36 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            />
          </Section>
        </div>
      </Modal>
    </>
  )
}
