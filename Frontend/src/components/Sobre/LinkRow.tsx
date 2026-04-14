import type { LinkType } from '@/types/sobre'
import { LinkTypeIcon } from './icons'

const LINK_ICON_MAP: Record<string, LinkType> = {
  'GitHub Repository': 'github',
  'Product Documentation': 'book',
  'Figma Design File': 'figma',
  'Project Board': 'grid',
  'API Base URL': 'terminal',
  'Deployment URL': 'globe',
}

export default function LinkRow({ label, url }: { label: string; url: string }) {
  const iconType = LINK_ICON_MAP[label] ?? 'globe'

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-[16px] border border-white/7 bg-surface-high/54 px-4 py-3.5 text-sm text-white/58 transition-[border-color,background-color,color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent-indigo/22 hover:bg-surface-high hover:text-white/84"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/8 bg-surface-base/78 text-accent-indigo/72">
        <LinkTypeIcon type={iconType} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="truncate font-medium text-white/84">{label}</span>
        <p className="mt-0.5 truncate text-[11px] text-white/28">{url.replace(/^https?:\/\//, '')}</p>
      </div>
      <span className="shrink-0 text-white/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white/58">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </span>
    </a>
  )
}
