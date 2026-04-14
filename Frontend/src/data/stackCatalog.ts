export interface StackOption {
  label: string
  value: string
  accentColor: string
  backgroundColor: string
  borderColor: string
}

export const STACK_OPTIONS: StackOption[] = [
  { label: 'React', value: 'react', accentColor: '#61DAFB', backgroundColor: 'rgba(97,218,251,0.10)', borderColor: 'rgba(97,218,251,0.28)' },
  { label: 'Next.js', value: 'next.js', accentColor: '#E5E7EB', backgroundColor: 'rgba(229,231,235,0.08)', borderColor: 'rgba(229,231,235,0.22)' },
  { label: 'Vue', value: 'vue', accentColor: '#41B883', backgroundColor: 'rgba(65,184,131,0.10)', borderColor: 'rgba(65,184,131,0.28)' },
  { label: 'Angular', value: 'angular', accentColor: '#DD0031', backgroundColor: 'rgba(221,0,49,0.10)', borderColor: 'rgba(221,0,49,0.28)' },
  { label: 'TypeScript', value: 'typescript', accentColor: '#3178C6', backgroundColor: 'rgba(49,120,198,0.12)', borderColor: 'rgba(49,120,198,0.28)' },
  { label: 'JavaScript', value: 'javascript', accentColor: '#F7DF1E', backgroundColor: 'rgba(247,223,30,0.10)', borderColor: 'rgba(247,223,30,0.28)' },
  { label: 'Node.js', value: 'node.js', accentColor: '#68A063', backgroundColor: 'rgba(104,160,99,0.10)', borderColor: 'rgba(104,160,99,0.28)' },
  { label: 'NestJS', value: 'nestjs', accentColor: '#E0234E', backgroundColor: 'rgba(224,35,78,0.10)', borderColor: 'rgba(224,35,78,0.28)' },
  { label: 'Python', value: 'python', accentColor: '#4B8BBE', backgroundColor: 'rgba(75,139,190,0.12)', borderColor: 'rgba(75,139,190,0.28)' },
  { label: 'FastAPI', value: 'fastapi', accentColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.28)' },
  { label: 'Django', value: 'django', accentColor: '#2BA977', backgroundColor: 'rgba(43,169,119,0.10)', borderColor: 'rgba(43,169,119,0.28)' },
  { label: 'Java', value: 'java', accentColor: '#F89820', backgroundColor: 'rgba(248,152,32,0.10)', borderColor: 'rgba(248,152,32,0.28)' },
  { label: 'Spring', value: 'spring', accentColor: '#6DB33F', backgroundColor: 'rgba(109,179,63,0.10)', borderColor: 'rgba(109,179,63,0.28)' },
  { label: 'C#', value: 'c#', accentColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.10)', borderColor: 'rgba(139,92,246,0.28)' },
  { label: '.NET', value: '.net', accentColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.10)', borderColor: 'rgba(124,58,237,0.28)' },
  { label: 'Go', value: 'go', accentColor: '#00ADD8', backgroundColor: 'rgba(0,173,216,0.10)', borderColor: 'rgba(0,173,216,0.28)' },
  { label: 'PHP', value: 'php', accentColor: '#777BB4', backgroundColor: 'rgba(119,123,180,0.10)', borderColor: 'rgba(119,123,180,0.28)' },
  { label: 'Laravel', value: 'laravel', accentColor: '#FF2D20', backgroundColor: 'rgba(255,45,32,0.10)', borderColor: 'rgba(255,45,32,0.28)' },
  { label: 'Ruby on Rails', value: 'ruby on rails', accentColor: '#CC0000', backgroundColor: 'rgba(204,0,0,0.10)', borderColor: 'rgba(204,0,0,0.28)' },
  { label: 'PostgreSQL', value: 'postgresql', accentColor: '#336791', backgroundColor: 'rgba(51,103,145,0.12)', borderColor: 'rgba(51,103,145,0.28)' },
  { label: 'MySQL', value: 'mysql', accentColor: '#00758F', backgroundColor: 'rgba(0,117,143,0.10)', borderColor: 'rgba(0,117,143,0.28)' },
  { label: 'MongoDB', value: 'mongodb', accentColor: '#13AA52', backgroundColor: 'rgba(19,170,82,0.10)', borderColor: 'rgba(19,170,82,0.28)' },
  { label: 'Redis', value: 'redis', accentColor: '#DC382D', backgroundColor: 'rgba(220,56,45,0.10)', borderColor: 'rgba(220,56,45,0.28)' },
  { label: 'Docker', value: 'docker', accentColor: '#2496ED', backgroundColor: 'rgba(36,150,237,0.10)', borderColor: 'rgba(36,150,237,0.28)' },
  { label: 'Kubernetes', value: 'kubernetes', accentColor: '#326CE5', backgroundColor: 'rgba(50,108,229,0.10)', borderColor: 'rgba(50,108,229,0.28)' },
  { label: 'AWS', value: 'aws', accentColor: '#FF9900', backgroundColor: 'rgba(255,153,0,0.10)', borderColor: 'rgba(255,153,0,0.28)' },
  { label: 'OpenAI', value: 'openai', accentColor: '#10A37F', backgroundColor: 'rgba(16,163,127,0.10)', borderColor: 'rgba(16,163,127,0.28)' },
  { label: 'LangChain', value: 'langchain', accentColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.10)', borderColor: 'rgba(124,58,237,0.28)' },
  { label: 'Pinecone', value: 'pinecone', accentColor: '#14B8A6', backgroundColor: 'rgba(20,184,166,0.10)', borderColor: 'rgba(20,184,166,0.28)' },
]

const FALLBACK_STACK_META: StackOption = {
  label: '',
  value: '',
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
