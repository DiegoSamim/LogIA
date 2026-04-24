import type { EntitySummaryDTO, RelationDTO } from '@/services/catalog.service'

interface Props {
  entities: EntitySummaryDTO[]
  relations: RelationDTO[]
  onSelect: (entity: EntitySummaryDTO) => void
  onCreate: () => void
}

const TAG_COLORS = [
  'border-accent-indigo/40 bg-accent-indigo/12 text-accent-indigo',
  'border-accent-violet/40 bg-accent-violet/12 text-accent-violet',
  'border-amber-400/40 bg-amber-400/12 text-amber-300',
  'border-emerald-400/40 bg-emerald-400/12 text-emerald-300',
  'border-rose-400/40 bg-rose-400/12 text-rose-300',
]

const BORDER_COLORS = ['bg-accent-indigo', 'bg-accent-violet', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400']

function pickColor(name: string, palette: string[]) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'view') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (type === 'collection') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  )
}

export default function CatalogCards({ entities, relations, onSelect, onCreate }: Props) {
  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-white/10 bg-surface-container/40 py-20 text-center">
        <p className="text-sm text-white/60">Catálogo vazio.</p>
        <p className="mt-1 text-xs text-white/36">Crie a primeira tabela ou importe um DDL.</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
        >
          + Nova tabela
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entities.map((entity) => {
        const borderColor = pickColor(entity.name, BORDER_COLORS)
        const entityRels = relations.filter(
          (r) => r.from_entity_id === entity.id || r.to_entity_id === entity.id,
        )
        const relatedNames = entityRels.map((r) =>
          r.from_entity_id === entity.id ? r.to_entity_name : r.from_entity_name,
        )
        return (
          <button
            key={entity.id}
            type="button"
            onClick={() => onSelect(entity)}
            className="group relative flex flex-col rounded-[12px] border border-white/6 bg-surface-container/80 p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-white/14 hover:bg-surface-container"
          >
                <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${borderColor}`} />
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-surface-high text-white/70">
                    <TypeIcon type={entity.entity_type} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white/92">{entity.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entity.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-[4px] border px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase ${pickColor(tag, TAG_COLORS)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-white/62">
                  {entity.description || <span className="italic text-white/34">Sem descrição.</span>}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/4 pt-3 text-[11px] text-white/50">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span>{entity.columns_count} cols</span>
                  </div>

                  {relatedNames.length > 0 ? (
                    <div className="flex min-w-0 items-center gap-1 text-white/42">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span className="truncate text-[10px]">
                        {relatedNames.slice(0, 2).join(', ')}
                        {relatedNames.length > 2 && ` +${relatedNames.length - 2}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/22">sem relações</span>
                  )}
                </div>
          </button>
        )
      })}
    </div>
  )
}
