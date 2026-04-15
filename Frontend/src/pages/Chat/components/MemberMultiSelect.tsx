import type { ProjectMemberLookup } from '@/pages/Chat/types'

function formatRole(role: ProjectMemberLookup['role']) {
  if (role === 'admin') return 'Admin'
  if (role === 'editor') return 'Editor'
  return 'Viewer'
}

export default function MemberMultiSelect({
  members,
  selectedIds,
  onToggle,
}: {
  members: ProjectMemberLookup[]
  selectedIds: string[]
  onToggle: (userId: string) => void
}) {
  return (
    <div className="space-y-2 py-1">
      <div className="flex flex-wrap gap-2">
        {members.map((member) => {
          const selected = selectedIds.includes(member.user_id)
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onToggle(member.user_id)}
              className={[
                'rounded-[14px] border px-3.5 py-2 text-left transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.98]',
                selected
                  ? 'border-accent-indigo/32 bg-accent-indigo/10 text-white'
                  : 'border-white/10 bg-surface-base/80 text-white/62 hover:border-white/18 hover:text-white/82',
              ].join(' ')}
            >
              <p className="text-sm font-medium">{member.user.name}</p>
              <p className="mt-1 text-[11px] text-white/42">{member.user.email}</p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-accent-indigo/76 uppercase">
                {formatRole(member.role)}
              </p>
            </button>
          )
        })}
      </div>
      {members.length === 0 && (
        <p className="text-xs text-white/36">Nenhum membro encontrado neste projeto.</p>
      )}
    </div>
  )
}
