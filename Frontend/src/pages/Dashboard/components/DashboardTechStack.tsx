import StackBadge from '@/components/ui/StackBadge'

export default function DashboardTechStack({ stack }: { stack: string[] }) {
  if (stack.length === 0) {
    return (
      <p className="text-sm text-white/28 italic">
        Nenhuma tecnologia configurada no perfil do projeto.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {stack.map((tech) => (
        <StackBadge key={tech} value={tech} />
      ))}
    </div>
  )
}
