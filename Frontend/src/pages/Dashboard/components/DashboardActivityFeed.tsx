import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent, { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent'
import type { TaskDTO } from '@/data/dtos'
import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { formatRelativeDate } from '@/components/Tasks/utils'

const STATUS_DOT_COLORS: Record<string, string> = {
  done: '#6ee7b7',       // emerald-300
  in_progress: '#a5b4fc', // indigo-300
  blocked: '#fdba74',    // orange-300
  todo: '#94a3b8',       // slate-400
  cancelled: '#fda4af',  // rose-300
}

export default function DashboardActivityFeed({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-2xl opacity-30">📋</span>
        <p className="mt-3 text-sm text-white/30">Nenhuma atividade registrada ainda.</p>
      </div>
    )
  }

  return (
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.28, px: 0 },
        p: 0,
        m: 0,
      }}
    >
      {tasks.map((task, idx) => {
        const categoryOption = CATEGORY_CHIP_OPTIONS.find((o) => o.value === task.category)
        const dotColor = STATUS_DOT_COLORS[task.status] ?? '#94a3b8'
        const isLast = idx === tasks.length - 1

        return (
          <TimelineItem key={task.id}>
            <TimelineOppositeContent sx={{ py: '10px', px: 0, pr: 1.5 }}>
              <span className="text-[10px] text-white/28 tabular-nums leading-none">
                {formatRelativeDate(task.updated_at)}
              </span>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  bgcolor: dotColor,
                  boxShadow: `0 0 0 4px ${dotColor}22`,
                  width: 8,
                  height: 8,
                  margin: '10px 0',
                  border: 'none',
                }}
              />
              {!isLast && (
                <TimelineConnector sx={{ bgcolor: 'rgba(255,255,255,0.07)', width: '1px' }} />
              )}
            </TimelineSeparator>

            <TimelineContent sx={{ py: '6px', px: 0, pl: 1.5, pb: isLast ? 0 : '14px' }}>
              <p className="text-sm font-medium leading-snug text-white/82 line-clamp-1">
                {task.title}
              </p>
              {categoryOption && (
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryOption.colorClass}`}
                >
                  {categoryOption.label}
                </span>
              )}
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
