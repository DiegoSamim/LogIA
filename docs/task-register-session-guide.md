# Guia de Registro de Tarefas para Outras Sessões

## Objetivo

Este documento serve como contexto operacional para outras sessões de IA conseguirem:

1. identificar tudo o que mudou em uma entrega
2. decidir se devem criar uma nova tarefa ou atualizar uma existente
3. preencher corretamente todo o formulário do modo `Registro`
4. gerar conteúdo consistente para `tasks`, `task_updates` e `knowledge_chunks`

Use este guia como fonte de verdade para responder o formulário do chat de registro com base em mudanças reais de código, comportamento, schema, UI ou backend.

## Fontes oficiais de verdade no código

Os pontos abaixo definem o comportamento real atual:

- Backend de tarefas: [Backend/app/services/task_service.py](/home/diego/programacao/LogIA/Backend/app/services/task_service.py)
- Backend de knowledge chunks: [Backend/app/services/knowledge_service.py](/home/diego/programacao/LogIA/Backend/app/services/knowledge_service.py)
- Schema de tarefas: [Backend/app/schemas/task.py](/home/diego/programacao/LogIA/Backend/app/schemas/task.py)
- Fluxo de registro no chat: [Frontend/src/pages/Chat/flows/TaskRegisterFlow.tsx](/home/diego/programacao/LogIA/Frontend/src/pages/Chat/flows/TaskRegisterFlow.tsx)
- Perguntas oficiais do formulário: [Frontend/src/pages/Chat/constants.tsx](/home/diego/programacao/LogIA/Frontend/src/pages/Chat/constants.tsx)
- Regras de resumo e payload de update: [Frontend/src/pages/Chat/utils.ts](/home/diego/programacao/LogIA/Frontend/src/pages/Chat/utils.ts)
- DTOs e enums: [Frontend/src/data/dtos.ts](/home/diego/programacao/LogIA/Frontend/src/data/dtos.ts)

## Resumo do fluxo real

### Criação de tarefa

Quando a ação é `create`, o sistema:

1. cria a linha em `tasks`
2. cria automaticamente um `task_update` inicial com `update_type='created'`
3. reindexa o snapshot da tarefa em `knowledge_chunks`
4. indexa também o update inicial em `knowledge_chunks`
5. se houver checklist, cria checkpoints depois
6. ao criar checkpoints, reindexa novamente o snapshot da tarefa

### Atualização de tarefa

Quando a ação é `update`, o sistema:

1. atualiza alguns campos da tarefa em `tasks`
2. reindexa o snapshot atualizado em `knowledge_chunks`
3. cria um novo registro em `task_updates`
4. indexa esse novo `task_update` em `knowledge_chunks`

Importante:

- o histórico evolutivo fica em `task_updates`
- o estado atual consolidado fica em `tasks`
- a base consultável futura fica em `knowledge_chunks`

## Regra principal para outras sessões

Antes de responder o formulário, a sessão deve reconstruir a mudança real a partir de evidências.

Ordem recomendada de coleta:

1. arquivos alterados no workspace ou no diff
2. comportamento funcional alterado
3. impacto de backend, frontend, migrations e stores
4. risco corrigido ou bug resolvido
5. passos restantes e débitos conhecidos
6. pessoas ou áreas envolvidas

Se a evidência for fraca, prefira preencher o campo com algo curto e verdadeiro em vez de inventar detalhe.

## Como decidir entre criar ou atualizar

### Criar nova tarefa quando

- a mudança representa uma entrega nova com objetivo próprio
- não existe tarefa anterior claramente equivalente
- o diff abre uma frente nova de trabalho
- o título natural da mudança descreve uma iniciativa, feature, bug fix ou refactor independente

### Atualizar tarefa existente quando

- a entrega continua um trabalho já aberto
- existe tarefa anterior com mesmo objetivo funcional
- a mudança representa progresso, correção, bloqueio, conclusão ou refinamento de algo já registrado

### Regra prática

Se a pergunta natural for "o que nasceu agora?", normalmente é `create`.

Se a pergunta natural for "o que avançou em algo que já existia?", normalmente é `update`.

## Campos do formulário de criação

Perguntas oficiais atuais do modo `create`:

1. `title`
2. `category`
3. `status`
4. `blocked_reason` se `status === blocked`
5. `priority`
6. `feature_or_ticket`
7. `task_summary`
8. `technical_approach`
9. `next_steps`
10. `people_involved`
11. `tags`
12. `checkpoints`
13. `hours_worked`

### Como preencher cada campo em criação

| Campo | Como pensar | O que salvar |
|---|---|---|
| `title` | Nome curto e estável da entrega | Resultado principal da tarefa |
| `category` | Tipo dominante do trabalho | `feature`, `bug_fix`, `refactor`, `test`, `ui_ux`, `docs`, `infra`, `research` |
| `status` | Estado atual real | `todo`, `in_progress`, `done`, `blocked`, `cancelled` |
| `blocked_reason` | Só se bloqueada | Motivo objetivo e verificável |
| `priority` | Urgência ou impacto | `critical`, `high`, `medium`, `low` |
| `feature_or_ticket` | Referência externa | Ticket, issue, branch, PR ou link |
| `task_summary` | Visão estável da tarefa | Objetivo e entrega principal |
| `technical_approach` | Como foi feito | Estratégia técnica, arquitetura, integrações |
| `next_steps` | O que falta | Próximos passos concretos |
| `people_involved` | Quem participou | Nomes ou emails dos envolvidos |
| `tags` | Pilha e ferramentas usadas | Ex: `react`, `zustand`, `fastapi`, `alembic` |
| `checkpoints` | Subentregas verificáveis | Itens curtos de checklist |
| `hours_worked` | Esforço da tarefa | Horas totais registradas nessa criação |

## Campos do formulário de atualização

Perguntas oficiais atuais do modo `update`:

1. `update_summary`
2. `update_task_summary`
3. `task_summary` se `update_task_summary === yes`
4. `status`
5. `blocked_reason` se `status === blocked`
6. `technical_approach`
7. `next_steps`
8. `tags`
9. `hours_worked`

### Como preencher cada campo em atualização

| Campo | Como pensar | O que salvar |
|---|---|---|
| `update_summary` | Novidade desta atualização | O que mudou agora, não a história inteira |
| `update_task_summary` | O resumo geral da tarefa mudou? | `yes` ou `no` |
| `task_summary` | Só quando o resumo geral precisa ser reescrito | Novo resumo consolidado |
| `status` | Estado após esta atualização | Novo status real |
| `blocked_reason` | Só se está bloqueada | Motivo atual do bloqueio |
| `technical_approach` | Detalhe técnico relevante desta rodada | O que foi implementado ou ajustado |
| `next_steps` | Próximas ações | Passos concretos depois desta atualização |
| `tags` | Stack usada ou revisada | Ferramentas e tecnologias tocadas |
| `hours_worked` | Horas adicionais desta rodada | Soma incremental, não total consolidado |

## Persistência real no backend

### Criação salva em `tasks`

Na criação, o frontend envia:

- `title`
- `category`
- `status`
- `priority`
- `feature_or_ticket`
- `what_was_done` a partir de `task_summary`
- `technical_approach`
- `next_steps`
- `blocked_reason`
- `people_involved`
- `tags`
- `hours_worked`

Depois disso:

- um `task_update` inicial é criado automaticamente com `update_type='created'`
- checkpoints são criados separadamente se informados

### Atualização salva em `tasks`

Na atualização, hoje o frontend envia apenas:

- `status`
- `what_was_done` se `update_task_summary === 'yes'`
- `technical_approach`
- `next_steps`
- `blocked_reason`
- `people_involved`
- `tags`
- `hours_worked` somado ao valor anterior

Importante:

- `title` não é atualizado no fluxo atual de chat
- `category` não é atualizada no fluxo atual de chat
- `priority` não é atualizada no fluxo atual de chat
- `feature_or_ticket` não é atualizado no fluxo atual de chat
- `hours_worked` em update é incremental, não substitutivo
- `tags` vazias no update limpam o valor salvo

### Atualização salva em `task_updates`

Depois do `PUT /tasks/:id`, o fluxo cria um `task_update` com:

- `update_type`
- `summary`
- `details`
- `old_status`
- `new_status`

Regra atual para `update_type`:

- `created` se é criação
- `completion` se o status mudou para `done`
- `blocker` se o status mudou para `blocked`
- `status_change` se o status mudou para outro valor diferente
- `progress` nos demais casos

Observação importante:

- o tipo `edit` existe no enum, mas o builder atual do chat não o gera automaticamente

## Como os knowledge chunks são montados

### Snapshot da tarefa

O snapshot usa `source_type='task_snapshot'` e representa o estado consolidado da tarefa.

Ele inclui:

- título
- categoria
- status atual
- feature ou ticket
- resumo da tarefa
- abordagem técnica
- prioridade
- motivo do bloqueio
- próximos passos
- pessoas envolvidas
- tags
- horas trabalhadas
- datas
- checklist

### Update da tarefa

O update usa `source_type='task_update'` e representa um evento de mudança.

Ele inclui:

- título da tarefa
- tipo de atualização
- resumo da atualização
- detalhes
- transição de status
- data da atualização

### Consequência prática

Se outra sessão preencher bem `task_summary`, `update_summary`, `technical_approach`, `next_steps`, `blocked_reason` e `tags`, a base futura de consulta ficará muito melhor.

## Estratégia recomendada para coletar todas as mudanças

Antes de responder o formulário, outra sessão deve produzir internamente este checklist:

1. Qual foi a entrega principal?
2. Isso é uma tarefa nova ou evolução de uma existente?
3. Qual problema foi resolvido?
4. Quais arquivos e camadas foram alterados?
5. Houve mudança de schema, API, store, componente ou fluxo?
6. O status final desta entrega é `done`, `in_progress` ou `blocked`?
7. Existe algo pendente ou um próximo passo evidente?
8. Houve bloqueio, risco, workaround ou dívida técnica?
9. Quais tecnologias aparecem de forma explícita nas mudanças?
10. Se for update, o resumo geral da tarefa precisa ser reescrito?

## Heurísticas de preenchimento por tipo de mudança

### Mudança de backend

- `category`: normalmente `feature`, `bug_fix`, `infra` ou `refactor`
- `technical_approach`: endpoints, services, models, migrations, validações, polling, persistência
- `tags`: `fastapi`, `sqlalchemy`, `alembic`, `postgresql`, `pgvector`

### Mudança de frontend

- `category`: normalmente `feature`, `bug_fix`, `ui_ux` ou `refactor`
- `technical_approach`: componentes, stores, hooks, roteamento, estado, race condition, loading
- `tags`: `react`, `typescript`, `zustand`, `vite`, `tailwind`

### Mudança de schema

- `category`: `infra` ou `feature`
- `technical_approach`: migration, tabelas novas, merge revision, compatibilidade de dados
- `tags`: `alembic`, `postgresql`

### Correção de bug

- `category`: `bug_fix`
- `update_summary`: descreve o defeito corrigido nesta rodada
- `blocked_reason`: só usar se o bug ainda impedir continuidade

## Regras de escrita

### `title`

Bom formato:

- verbo no infinitivo ou substantivo de entrega
- claro o suficiente para ser entendido sozinho

Exemplos:

- `Implementar sessões persistidas no modo consulta`
- `Corrigir loop infinito da sidebar no modo consulta`
- `Adicionar query_runs e polling cancelável no chat`

### `task_summary`

Deve responder:

- qual problema a tarefa resolve
- qual entrega principal ela representa
- qual comportamento estável passa a existir

Evite:

- listar arquivo por arquivo
- escrever histórico de tentativas
- repetir detalhes de update momentâneo

### `update_summary`

Deve responder:

- o que mudou nesta atualização específica
- qual avanço concreto aconteceu agora

Bom formato:

- curto
- factual
- orientado a resultado

Exemplos:

- `Integrei o modo consulta com sessions, messages e query_runs reais.`
- `Corrigi o selector do Zustand na sidebar para evitar loop infinito ao renderizar sessões vazias.`
- `Apliquei a migration de merge do Alembic e normalizei o head único do schema.`

### `technical_approach`

Descreva:

- arquitetura
- serviços
- stores
- endpoints
- estratégias de concorrência
- migrações

### `next_steps`

Descreva o que ainda falta de forma acionável.

Exemplos:

- `Conectar o executor mock a uma LLM real com ranking por chunk.`
- `Adicionar testes de integração para troca rápida de sessão e cancelamento.`
- `Permitir renomear sessões de consulta após a primeira pergunta.`

## Exemplos completos

## Exemplo 1: criação de uma nova tarefa

Situação:

- foi implementado o modo consulta com múltiplas sessões, histórico persistido, polling, cancelamento e integração com `query_runs`
- essa entrega ainda não existia antes

Preenchimento sugerido:

```md
action: create
title: Implementar modo consulta com sessões persistidas e histórico real
category: feature
status: done
priority: high
feature_or_ticket: null
task_summary: Construir o modo de consulta do chat com múltiplas sessões por projeto, histórico persistido, polling de respostas, cancelamento de execução e integração real com chat_sessions, chat_messages e query_runs.
technical_approach: Refatorei o fluxo RegularChatFlow para operar por sessão real, criei store persistido com Zustand e BroadcastChannel, adicionei endpoints de query run no backend, implementei polling cancelável com AbortController e persisti perguntas e respostas em chat_messages com vínculo por sessionId e runId.
next_steps: Substituir o executor mock por RAG/LLM real e adicionar testes automatizados para race condition e recuperação após reload.
blocked_reason: null
people_involved: Diego
tags:
  - react
  - typescript
  - zustand
  - fastapi
  - sqlalchemy
  - alembic
  - postgresql
checkpoints:
  - Listar sessões query na sidebar
  - Persistir histórico por sessão
  - Implementar polling e cancelamento
  - Suportar reload com reconciliação de run
hours_worked: 6.5
```

Consequência persistida:

- cria `tasks`
- cria `task_update(created)`
- gera snapshot em `knowledge_chunks`
- gera update inicial em `knowledge_chunks`

## Exemplo 2: atualização de tarefa existente com progresso

Situação:

- a tarefa já existia
- nesta rodada foi corrigido o loop infinito da sidebar

Preenchimento sugerido:

```md
action: update
selected_task: Implementar modo consulta com sessões persistidas e histórico real
update_summary: Corrigi o loop infinito da sidebar e do fluxo de consulta causado por selectors do Zustand que retornavam arrays novos a cada render quando não havia sessões.
update_task_summary: no
status: done
technical_approach: Ajustei Sidebar e RegularChatFlow para ler slices estáveis do store e aplicar fallback com constantes compartilhadas fora do selector, eliminando o warning de getSnapshot e o erro de maximum update depth exceeded.
next_steps: Validar se ainda existem outros selectors instáveis em fluxos derivados e cobrir esse cenário com testes de renderização.
blocked_reason: null
tags:
  - react
  - zustand
  - typescript
hours_worked: 0.8
```

Consequência persistida:

- atualiza `tasks.status`, `technical_approach`, `next_steps`, `tags`, `hours_worked`
- cria `task_update(progress ou status_change, dependendo do status anterior)`
- reindexa snapshot
- indexa o update novo

## Exemplo 3: atualização com mudança real do resumo da tarefa

Situação:

- a tarefa começou como "implementar consulta mock"
- depois evoluiu para "modo consulta completo com sessões persistidas, histórico real e query_runs"
- o resumo consolidado precisa mudar

Preenchimento sugerido:

```md
action: update
selected_task: Implementar consulta mock inicial
update_summary: Evoluí a implementação para um fluxo completo com sessões persistidas, histórico real, polling, cancelamento e integração com query_runs.
update_task_summary: yes
task_summary: Consolidar o modo consulta do chat como um fluxo real baseado em sessões persistidas, histórico por sessão, runs canceláveis e backend preparado para futura integração com RAG/LLM.
status: in_progress
technical_approach: Adicionei a entidade de execução por run, persistência por sessão, sincronização entre abas, polling reconciliável e integração com mensagens salvas no backend.
next_steps: Finalizar a tela, revisar UX e plugar a geração real de resposta.
blocked_reason: null
tags:
  - react
  - zustand
  - fastapi
  - sqlalchemy
hours_worked: 2.0
```

## Template pronto para outra sessão preencher

```md
## Evidências coletadas

- Arquivos alterados:
- Mudanças funcionais:
- Mudanças de backend:
- Mudanças de frontend:
- Mudanças de schema:
- Bugs corrigidos:
- Pendências:

## Decisão

- action: create | update
- motivo:
- tarefa existente relacionada:

## Formulário sugerido

### Se for create

- title:
- category:
- status:
- blocked_reason:
- priority:
- feature_or_ticket:
- task_summary:
- technical_approach:
- next_steps:
- people_involved:
- tags:
- checkpoints:
- hours_worked:

### Se for update

- selected_task:
- update_summary:
- update_task_summary:
- task_summary:
- status:
- blocked_reason:
- technical_approach:
- next_steps:
- tags:
- hours_worked:
```

## Prompt-base para outra sessão

Use este prompt como instrução inicial:

```md
Analise todas as mudanças feitas no projeto e preencha o formulário do modo Registro de tarefas com base em evidências reais do código.

Siga estas regras:

1. Primeiro decida se a mudança pede create ou update.
2. Não invente contexto que não esteja sustentado pelas mudanças.
3. Para create, descreva a entrega principal como tarefa nova.
4. Para update, descreva apenas a novidade desta rodada em update_summary.
5. Só marque update_task_summary como yes quando o resumo consolidado da tarefa realmente mudou.
6. Use technical_approach para explicar backend, frontend, schema, stores, endpoints e estratégias técnicas tocadas.
7. Use next_steps para pendências reais.
8. Tags devem refletir tecnologias explicitamente presentes nas mudanças.
9. Se houver risco de apagar informação existente em update, sinalize isso.
10. Entregue a resposta final em formato estruturado e pronto para ser lançado no formulário.
```

## Cuidados importantes

- Em update, não assuma que todos os campos do draft serão persistidos. Hoje o chat não atualiza `title`, `category`, `priority` nem `feature_or_ticket`.
- Em update, `hours_worked` soma ao valor anterior.
- Em update, `tags` vazias limpam a lista da tarefa.
- O melhor campo para alimentar consulta futura é um bom `task_summary` e um bom `update_summary`.
- Se a entrega incluiu migração, backend, frontend e correção de bug, isso pode continuar sendo uma única tarefa se fizer parte da mesma frente.

