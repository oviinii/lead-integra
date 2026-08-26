# Banco de Dados

PostgreSQL 16 + Prisma 5.

## Entidades principais

- **User** — usuário da plataforma, pode ser SUPER_ADMIN.
- **Workspace** — multi-tenant, pertence a um owner.
- **WorkspaceMember** — vínculo N:N entre User e Workspace com `role`.
- **Company** — empresa encontrada; deduplicada por (workspaceId, externalId, source) + telefone normalizado + domínio.
- **Lead** — empresa marcada como lead pelo usuário.
- **Tag** — tags livres por workspace.
- **LeadList** — listas de leads.
- **Search** — pesquisa + filtros + status.
- **SearchResult** — N:N Search × Company.
- **CreditBalance** + **CreditTransaction** — sistema de créditos.
- **Export** — registro de exportação (status, rowCount).
- **EnrichmentJob** — fila de enriquecimento (preparada).
- **Notification** — notificações in-app.
- **AuditLog** — auditoria.
- **Provider** — registro de provedores de dados.
- **Plan** — planos (FREE, STARTER, PRO, ENTERPRISE).
- **ApiKey** — chaves de API.

## Migrações

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy  # produção
```

## Seed

```bash
npm run seed
```

Cria:
- 4 Plans
- 1 Provider (primary)
- 1 SUPER_ADMIN (`admin@lead.local`)
- 1 usuário demo (`demo@lead.local`)
- 1 workspace "Agência Demo"
- 4 tags
- 3 listas
- 24 empresas fictícias (12 viram leads)

## Índices importantes

- Company: `(workspaceId)`, `(workspaceId, city)`, `(workspaceId, state)`, `(workspaceId, category)`, `(document)`.
- Lead: `(workspaceId, status)`, `(workspaceId, score)`.
- Search: `(workspaceId, status)`, `(workspaceId, createdAt)`.

## LGPD

- Dados são sempre empresariais.
- `CompanyDataSource` registra origem por campo.
- WorkspaceMember/User são isolados por workspace.
