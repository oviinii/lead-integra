# API

Base URL: `/api`

Todos endpoints (exceto `/auth/*` e `/health`) exigem:
- Header `Authorization: Bearer <token>`
- Header `x-workspace-id: <workspaceId>`

## Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Cadastro + criação de workspace |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/forgot-password | Solicita reset |
| POST | /auth/reset-password | Reseta senha |
| POST | /auth/logout | Logout (revoga refresh) |
| GET  | /auth/me | Usuário atual |
| POST | /auth/change-password | Trocar senha |

## Workspaces

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /workspaces | Listar workspaces do usuário |
| POST | /workspaces | Criar workspace |
| GET  | /workspaces/:id | Detalhe |
| PATCH| /workspaces/:id | Atualizar |
| GET  | /workspaces/:id/members | Listar membros |
| POST | /workspaces/:id/members | Convidar membro |
| PATCH| /workspaces/:id/members/:memberId | Alterar role |
| DELETE| /workspaces/:id/members/:memberId | Remover |

## Search

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /search | Criar pesquisa |
| GET  | /search | Histórico |
| GET  | /search/:id | Resultados |
| POST | /search/:id/cancel | Cancelar |

## Companies

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /companies | Listar (filtros, paginação) |
| GET  | /companies/:id | Detalhe |

## Leads

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /leads | Listar |
| POST | /leads | Criar (a partir de companyId) |
| GET  | /leads/:id | Detalhe |
| PATCH| /leads/:id | Atualizar |
| DELETE| /leads/:id | Remover |
| POST | /leads/:id/status | Alterar status |

## Tags

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /tags | Listar |
| POST | /tags | Criar |
| DELETE| /tags/:id | Remover |
| POST | /tags/leads/:leadId/:tagId | Adicionar tag ao lead |
| DELETE| /tags/leads/:leadId/:tagId | Remover |

## Lists

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /lists | Listar |
| POST | /lists | Criar |
| GET  | /lists/:id | Detalhe |
| PATCH| /lists/:id | Atualizar |
| DELETE| /lists/:id | Remover |
| POST | /lists/:id/items | Adicionar leads |
| DELETE| /lists/:id/items/:leadId | Remover lead |

## Exports

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /exports | Exportar (CSV) |
| GET  | /exports | Histórico |

## Credits

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /credits | Saldo |
| GET  | /credits/transactions | Histórico |

## Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /dashboard | Métricas agregadas |

## Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /admin/overview | Visão geral |
| GET  | /admin/users | Listar usuários |
| PATCH| /admin/users/:id | Atualizar (ativo, super admin) |
| GET  | /admin/workspaces | Listar |
| GET  | /admin/providers | Listar providers |
| PATCH| /admin/providers/:id | Ativar/desativar |

## Notifications

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | /notifications | Listar |
| PATCH| /notifications/:id/read | Marcar lida |
| POST | /notifications/read-all | Marcar todas |

## Erros

```json
{ "error": "INSUFFICIENT_CREDITS", "message": "Insufficient credits" }
```

Códigos comuns: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INSUFFICIENT_CREDITS`, `INTERNAL_ERROR`.
