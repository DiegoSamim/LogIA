export type StackCategoryKey =
  | 'frontend_stack'
  | 'backend_stack'
  | 'infra_stack'
  | 'database_stack'
  | 'other_stack'

export interface StackOption {
  label: string
  value: string
  category: StackCategoryKey
  accentColor: string
  backgroundColor: string
  borderColor: string
}

export const STACK_OPTIONS: StackOption[] = [
  { label: 'React', value: 'react', category: 'frontend_stack', accentColor: '#61DAFB', backgroundColor: 'rgba(97,218,251,0.10)', borderColor: 'rgba(97,218,251,0.28)' },
  { label: 'Vite', value: 'vite', category: 'frontend_stack', accentColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.10)', borderColor: 'rgba(168,85,247,0.28)' },
  { label: 'Next.js', value: 'next.js', category: 'frontend_stack', accentColor: '#E5E7EB', backgroundColor: 'rgba(229,231,235,0.08)', borderColor: 'rgba(229,231,235,0.22)' },
  { label: 'Angular', value: 'angular', category: 'frontend_stack', accentColor: '#DD0031', backgroundColor: 'rgba(221,0,49,0.10)', borderColor: 'rgba(221,0,49,0.28)' },
  { label: 'Vue', value: 'vue', category: 'frontend_stack', accentColor: '#41B883', backgroundColor: 'rgba(65,184,131,0.10)', borderColor: 'rgba(65,184,131,0.28)' },
  { label: 'Nuxt', value: 'nuxt', category: 'frontend_stack', accentColor: '#00DC82', backgroundColor: 'rgba(0,220,130,0.10)', borderColor: 'rgba(0,220,130,0.28)' },
  { label: 'React Native', value: 'react native', category: 'frontend_stack', accentColor: '#61DAFB', backgroundColor: 'rgba(97,218,251,0.10)', borderColor: 'rgba(97,218,251,0.28)' },
  { label: 'Expo', value: 'expo', category: 'frontend_stack', accentColor: '#F8FAFC', backgroundColor: 'rgba(248,250,252,0.08)', borderColor: 'rgba(248,250,252,0.22)' },
  { label: 'Tailwind CSS', value: 'tailwind css', category: 'frontend_stack', accentColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.10)', borderColor: 'rgba(56,189,248,0.28)' },
  { label: 'Material UI', value: 'material ui', category: 'frontend_stack', accentColor: '#007FFF', backgroundColor: 'rgba(0,127,255,0.10)', borderColor: 'rgba(0,127,255,0.28)' },
  { label: 'Node.js', value: 'node.js', category: 'backend_stack', accentColor: '#68A063', backgroundColor: 'rgba(104,160,99,0.10)', borderColor: 'rgba(104,160,99,0.28)' },
  { label: 'Express', value: 'express', category: 'backend_stack', accentColor: '#E5E7EB', backgroundColor: 'rgba(229,231,235,0.08)', borderColor: 'rgba(229,231,235,0.22)' },
  { label: 'NestJS', value: 'nestjs', category: 'backend_stack', accentColor: '#E0234E', backgroundColor: 'rgba(224,35,78,0.10)', borderColor: 'rgba(224,35,78,0.28)' },
  { label: 'FastAPI', value: 'fastapi', category: 'backend_stack', accentColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.28)' },
  { label: 'Django', value: 'django', category: 'backend_stack', accentColor: '#2BA977', backgroundColor: 'rgba(43,169,119,0.10)', borderColor: 'rgba(43,169,119,0.28)' },
  { label: 'Spring Boot', value: 'spring boot', category: 'backend_stack', accentColor: '#6DB33F', backgroundColor: 'rgba(109,179,63,0.10)', borderColor: 'rgba(109,179,63,0.28)' },
  { label: '.NET', value: '.net', category: 'backend_stack', accentColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.10)', borderColor: 'rgba(124,58,237,0.28)' },
  { label: 'Laravel', value: 'laravel', category: 'backend_stack', accentColor: '#FF2D20', backgroundColor: 'rgba(255,45,32,0.10)', borderColor: 'rgba(255,45,32,0.28)' },
  { label: 'Go', value: 'go', category: 'backend_stack', accentColor: '#00ADD8', backgroundColor: 'rgba(0,173,216,0.10)', borderColor: 'rgba(0,173,216,0.28)' },
  { label: 'Ruby on Rails', value: 'ruby on rails', category: 'backend_stack', accentColor: '#CC0000', backgroundColor: 'rgba(204,0,0,0.10)', borderColor: 'rgba(204,0,0,0.28)' },
  { label: 'AWS', value: 'aws', category: 'infra_stack', accentColor: '#FF9900', backgroundColor: 'rgba(255,153,0,0.10)', borderColor: 'rgba(255,153,0,0.28)' },
  { label: 'Azure', value: 'azure', category: 'infra_stack', accentColor: '#0078D4', backgroundColor: 'rgba(0,120,212,0.10)', borderColor: 'rgba(0,120,212,0.28)' },
  { label: 'GCP', value: 'gcp', category: 'infra_stack', accentColor: '#4285F4', backgroundColor: 'rgba(66,133,244,0.10)', borderColor: 'rgba(66,133,244,0.28)' },
  { label: 'Docker', value: 'docker', category: 'infra_stack', accentColor: '#2496ED', backgroundColor: 'rgba(36,150,237,0.10)', borderColor: 'rgba(36,150,237,0.28)' },
  { label: 'Kubernetes', value: 'kubernetes', category: 'infra_stack', accentColor: '#326CE5', backgroundColor: 'rgba(50,108,229,0.10)', borderColor: 'rgba(50,108,229,0.28)' },
  { label: 'Terraform', value: 'terraform', category: 'infra_stack', accentColor: '#7B42BC', backgroundColor: 'rgba(123,66,188,0.10)', borderColor: 'rgba(123,66,188,0.28)' },
  { label: 'GitHub Actions', value: 'github actions', category: 'infra_stack', accentColor: '#2088FF', backgroundColor: 'rgba(32,136,255,0.10)', borderColor: 'rgba(32,136,255,0.28)' },
  { label: 'Nginx', value: 'nginx', category: 'infra_stack', accentColor: '#009639', backgroundColor: 'rgba(0,150,57,0.10)', borderColor: 'rgba(0,150,57,0.28)' },
  { label: 'Cloudflare', value: 'cloudflare', category: 'infra_stack', accentColor: '#F38020', backgroundColor: 'rgba(243,128,32,0.10)', borderColor: 'rgba(243,128,32,0.28)' },
  { label: 'PostgreSQL', value: 'postgresql', category: 'database_stack', accentColor: '#336791', backgroundColor: 'rgba(51,103,145,0.12)', borderColor: 'rgba(51,103,145,0.28)' },
  { label: 'MySQL', value: 'mysql', category: 'database_stack', accentColor: '#00758F', backgroundColor: 'rgba(0,117,143,0.10)', borderColor: 'rgba(0,117,143,0.28)' },
  { label: 'SQL Server', value: 'sql server', category: 'database_stack', accentColor: '#CC2927', backgroundColor: 'rgba(204,41,39,0.10)', borderColor: 'rgba(204,41,39,0.28)' },
  { label: 'MongoDB', value: 'mongodb', category: 'database_stack', accentColor: '#13AA52', backgroundColor: 'rgba(19,170,82,0.10)', borderColor: 'rgba(19,170,82,0.28)' },
  { label: 'Redis', value: 'redis', category: 'database_stack', accentColor: '#DC382D', backgroundColor: 'rgba(220,56,45,0.10)', borderColor: 'rgba(220,56,45,0.28)' },
  { label: 'Elasticsearch', value: 'elasticsearch', category: 'database_stack', accentColor: '#FEC514', backgroundColor: 'rgba(254,197,20,0.10)', borderColor: 'rgba(254,197,20,0.28)' },
]

const FALLBACK_STACK_META: StackOption = {
  label: '',
  value: '',
  category: 'other_stack',
  accentColor: '#A1A1AA',
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.14)',
}

export function normalizeStackName(value: string): string {
  return value.trim().toLowerCase()
}

export function resolveStackOption(value: string): StackOption {
  const normalized = normalizeStackName(value)
  const found = STACK_OPTIONS.find((option) => option.value === normalized || normalizeStackName(option.label) === normalized)
  if (found) return found

  return {
    ...FALLBACK_STACK_META,
    label: value.trim(),
    value: normalized,
  }
}

export function toStackDisplayLabel(value: string): string {
  return resolveStackOption(value).label || value.trim()
}

export function getStackOptionsByCategory(category: StackCategoryKey): StackOption[] {
  return STACK_OPTIONS.filter((option) => option.category === category)
}

export function normalizeStackValues(values: string[]): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const label = toStackDisplayLabel(value)
    if (!label) continue
    const key = normalizeStackName(label)
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(label)
  }
  return normalized
}

export function categorizeStackValues(values: string[]): Record<StackCategoryKey, string[]> {
  const initial: Record<StackCategoryKey, string[]> = {
    frontend_stack: [],
    backend_stack: [],
    infra_stack: [],
    database_stack: [],
    other_stack: [],
  }

  for (const value of normalizeStackValues(values)) {
    const option = resolveStackOption(value)
    const category = STACK_OPTIONS.some((item) => item.value === option.value)
      ? option.category
      : 'other_stack'
    initial[category].push(option.label)
  }

  return initial
}

export function combineCategorizedStacks(groups: Partial<Record<StackCategoryKey, string[]>>): string[] {
  return normalizeStackValues([
    ...(groups.frontend_stack ?? []),
    ...(groups.backend_stack ?? []),
    ...(groups.infra_stack ?? []),
    ...(groups.database_stack ?? []),
    ...(groups.other_stack ?? []),
  ])
}
