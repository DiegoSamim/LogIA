# Guia Simples para Responder o Chat de Registro de Tarefas

## Objetivo

Este guia é para outra sessão de IA que acabou de executar uma tarefa e, no final, precisa responder todas as perguntas do chat de `Criação` ou `Atualização` com base no histórico do que foi feito.

A ideia é simples:

1. olhar tudo o que foi feito na sessão
2. resumir isso de forma fiel
3. preencher cada pergunta do chat sem inventar contexto

## Como usar

Ao final de uma sessão de trabalho, peça para a IA:

> Com base em todo o histórico desta sessão, responda todas as perguntas do chat de registro de tarefas da forma mais fiel possível.

Essa IA deve usar:

- mudanças de código feitas
- bugs corrigidos
- arquivos alterados
- decisões técnicas
- pendências restantes
- contexto já discutido com o usuário

## Regra principal

A IA deve responder como se estivesse preenchendo o formulário final do chat.

Ela não deve:

- inventar informação que não apareceu na sessão
- exagerar escopo
- criar ticket, prioridade ou pessoa envolvida sem evidência

Se algum campo não tiver base suficiente, ela deve responder com:

- `null`
- vazio
- ou uma observação curta como `não informado`

dependendo do formato esperado.

## Primeiro passo: decidir entre criação ou atualização

### Use `create` quando

- a sessão implementou uma tarefa nova
- não existe uma tarefa anterior claramente associada
- o trabalho representa uma entrega nova

### Use `update` quando

- a sessão continuou uma tarefa já existente
- houve progresso, correção, conclusão ou bloqueio em algo que já estava aberto

## Perguntas do chat de criação

Se a ação for `create`, a IA deve responder:

1. `title`
2. `category`
3. `status`
4. `blocked_reason` se bloqueada
5. `priority`
6. `feature_or_ticket`
7. `task_summary`
8. `technical_approach`
9. `next_steps`
10. `people_involved`
11. `tags`
12. `checkpoints`
13. `hours_worked`

### Como responder cada uma

#### `title`

Use um título curto e claro da entrega.

Exemplos:

- `Implementar integração do modo consulta com query_runs`
- `Corrigir loop infinito da sidebar no chat`

#### `category`

Escolha a categoria dominante:

- `feature`
- `bug_fix`
- `refactor`
- `test`
- `ui_ux`
- `docs`
- `infra`
- `research`

Regra prática:

- nova funcionalidade: `feature`
- correção de erro: `bug_fix`
- reorganização técnica sem mudar objetivo principal: `refactor`
- migration, dev script, infraestrutura: `infra`

#### `status`

Escolha o estado real ao fim da sessão:

- `done`
- `in_progress`
- `blocked`
- `todo`
- `cancelled`

Regra prática:

- terminou e está funcional: `done`
- avançou mas ainda falta: `in_progress`
- não dá para seguir por dependência ou erro externo: `blocked`

#### `blocked_reason`

Preencha só se o status for `blocked`.

Descreva objetivamente o impedimento.

Exemplo:

- `Dependência do backend ainda não expõe o endpoint necessário.`

#### `priority`

Se houver evidência clara:

- `critical`
- `high`
- `medium`
- `low`

Se não houver evidência, use `null`.

#### `feature_or_ticket`

Use só se existir referência explícita:

- nome de ticket
- número de issue
- PR
- link

Se não existir, use `null`.

#### `task_summary`

Descreva o objetivo principal da tarefa de forma estável.

Deve responder:

- o que foi construído ou corrigido
- para que isso serve
- qual entrega principal ficou pronta

#### `technical_approach`

Descreva como foi feito tecnicamente.

Inclua o que realmente foi tocado:

- backend
- frontend
- store
- rotas
- migrations
- components
- services
- race condition
- polling
- persistência

#### `next_steps`

Liste o que ainda falta depois desta sessão.

Se terminou tudo, pode usar:

- `Nenhum próximo passo imediato identificado.`

#### `people_involved`

Liste apenas quem apareceu no histórico da sessão.

Se só houver o usuário, pode usar o nome dele ou deixar simples.

#### `tags`

Liste tecnologias e ferramentas realmente usadas.

Exemplos:

- `react`
- `typescript`
- `zustand`
- `fastapi`
- `sqlalchemy`
- `alembic`
- `postgresql`

#### `checkpoints`

Liste subentregas curtas da tarefa.

Exemplos:

- `Adicionar endpoint de query run`
- `Persistir sessão de consulta`
- `Corrigir selector instável do Zustand`

#### `hours_worked`

Se a sessão tiver estimativa clara, informe.

Se não tiver, use `null`.

## Perguntas do chat de atualização

Se a ação for `update`, a IA deve responder:

1. `update_summary`
2. `update_task_summary`
3. `task_summary` se `update_task_summary = yes`
4. `status`
5. `blocked_reason` se bloqueada
6. `technical_approach`
7. `next_steps`
8. `tags`
9. `hours_worked`

### Como responder cada uma

#### `update_summary`

Descreva apenas o que mudou nesta rodada.

Não repita toda a história da tarefa.

Exemplos:

- `Integrei o modo consulta com sessões persistidas, polling e cancelamento.`
- `Corrigi o erro de loop infinito na sidebar causado por selectors instáveis do Zustand.`

#### `update_task_summary`

Responda `yes` somente se o resumo geral da tarefa precisar ser reescrito.

Use `no` quando a tarefa continua a mesma e só houve avanço.

#### `task_summary`

Só preencha quando `update_task_summary = yes`.

Escreva o novo resumo consolidado da tarefa inteira.

#### `status`

Informe o status atual da tarefa após essa atualização.

#### `blocked_reason`

Só preencha se o novo status for `blocked`.

#### `technical_approach`

Explique o detalhe técnico relevante desta rodada.

#### `next_steps`

Liste o que ainda falta depois desta atualização.

#### `tags`

Liste apenas as tecnologias tocadas nesta rodada ou ainda relevantes para a tarefa.

#### `hours_worked`

Informe as horas adicionais desta atualização, não o total histórico.

Se não souber, use `null`.

## Regra curta para resumir a sessão antes de responder

Antes de preencher, a IA deve montar internamente este resumo:

- O que foi feito?
- Isso é tarefa nova ou avanço de tarefa existente?
- Qual problema foi resolvido?
- Quais arquivos e camadas foram alterados?
- O que ainda falta?
- Quais tecnologias aparecem claramente?

Com isso, ela já consegue responder quase todo o chat.

## Prompt pronto para usar em outra sessão

```md
Com base em todo o histórico desta sessão, responda o formulário final do chat de registro de tarefas.

Regras:

1. Primeiro decida se é `create` ou `update`.
2. Use apenas informações sustentadas pelo histórico da sessão.
3. Se for `create`, responda todos os campos do fluxo de criação.
4. Se for `update`, responda todos os campos do fluxo de atualização.
5. Não invente ticket, prioridade, pessoas ou horas se isso não apareceu.
6. Em `task_summary`, descreva a tarefa como entrega estável.
7. Em `update_summary`, descreva apenas o avanço desta rodada.
8. Em `technical_approach`, explique as mudanças técnicas reais.
9. Em `next_steps`, liste pendências reais.
10. Entregue a resposta em formato estruturado, pronta para eu usar no chat.
```

## Exemplo de saída esperada para criação

```md
action: create
title: Corrigir loop infinito da sidebar no modo consulta
category: bug_fix
status: done
blocked_reason: null
priority: high
feature_or_ticket: null
task_summary: Corrigir o loop infinito de renderização na sidebar e no fluxo de consulta causado por selectors instáveis do Zustand ao lidar com sessões vazias.
technical_approach: Ajustei os selectors do store para usarem referências estáveis e fallbacks compartilhados fora do hook, evitando o warning de getSnapshot e o erro de maximum update depth exceeded.
next_steps: Validar se existem outros selectors com o mesmo padrão em fluxos relacionados.
people_involved: Diego
tags:
  - react
  - typescript
  - zustand
checkpoints:
  - Identificar o loop na Sidebar
  - Corrigir selector com fallback estável
  - Ajustar RegularChatFlow
  - Validar build do frontend
hours_worked: null
```

## Exemplo de saída esperada para atualização

```md
action: update
selected_task: Implementar modo consulta com sessões persistidas e histórico real
update_summary: Corrigi o loop infinito da sidebar e do fluxo de consulta ao estabilizar os selectors do Zustand usados quando não havia sessões carregadas.
update_task_summary: no
status: done
blocked_reason: null
technical_approach: Substituí fallbacks inline por constantes compartilhadas e passei a ler slices estáveis do store antes de derivar os arrays usados nos componentes.
next_steps: Revisar outros pontos do chat para prevenir novos problemas de renderização com selectors derivados.
tags:
  - react
  - typescript
  - zustand
hours_worked: null
```

