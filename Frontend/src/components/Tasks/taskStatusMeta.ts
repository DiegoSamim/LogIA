import type { TaskStatus } from '@/data/dtos'

export const TASK_STATUS_META: Record<
  TaskStatus,
  { dotClass: string; subtleClass: string }
> = {
  todo: {
    dotClass: 'bg-slate-300 border-slate-200/40 shadow-[0_0_0_6px_rgba(148,163,184,0.12)]',
    subtleClass: 'text-slate-200',
  },
  in_progress: {
    dotClass: 'bg-amber-300 border-amber-200/50 shadow-[0_0_0_6px_rgba(251,191,36,0.12)]',
    subtleClass: 'text-amber-200',
  },
  done: {
    dotClass: 'bg-emerald-300 border-emerald-200/50 shadow-[0_0_0_6px_rgba(52,211,153,0.14)]',
    subtleClass: 'text-emerald-200',
  },
  blocked: {
    dotClass: 'bg-orange-300 border-orange-200/50 shadow-[0_0_0_6px_rgba(251,146,60,0.14)]',
    subtleClass: 'text-orange-200',
  },
  cancelled: {
    dotClass: 'bg-rose-300 border-rose-200/50 shadow-[0_0_0_6px_rgba(251,113,133,0.14)]',
    subtleClass: 'text-rose-200',
  },
}
