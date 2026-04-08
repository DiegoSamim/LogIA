# LogIA Frontend

Frontend da aplicação LogIA, construído com React + TypeScript + Vite.

## Scripts

- `npm run dev` inicia o ambiente local.
- `npm run build` gera o build de produção.
- `npm run preview` abre o build localmente.


DTO

Tela de Projetos

interface ProjectDTO {
  id: string
  name: string
  description: string
  status: string
  color: string           // de projects.color
  repository_url: string
  stack: string[]         // de project_profiles.main_stack (JOIN)
  last_session_at: string // MAX(chat_sessions.started_at) (JOIN)
  task_count: number      // COUNT(tasks) (subquery/join)
  done_count: number      // COUNT(tasks WHERE status='done')
  created_at: string
}