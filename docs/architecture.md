# Arquitetura

## Visão Geral

Sistema multi-tenant SaaS para geração, enriquecimento e organização de leads B2B.

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (React + Vite + TS)                            │
│  - Auth, Multi-workspace, Dark mode, Responsivo         │
└──────────────────────┬──────────────────────────────────┘
                       │ REST/JSON
┌──────────────────────▼──────────────────────────────────┐
│ Backend (Fastify + TS)                                  │
│  - Modular por domínio (auth, workspaces, search...)    │
│  - JWT + Refresh Token                                  │
│  - RBAC, multi-tenant isolation via x-workspace-id     │
│  - Helmet, CORS, Rate limit, Zod validation             │
└──────────────────────┬──────────────────────────────────┘
                       │ Prisma
┌──────────────────────▼──────────────────────────────────┐
│ PostgreSQL + Redis (cache/queue)                        │
│   - BullMQ preparado para jobs assíncronos              │
└─────────────────────────────────────────────────────────┘
```

## Camadas Backend

```
backend/src/
├── modules/
│   ├── auth/           registro, login, refresh, reset
│   ├── workspaces/     multi-tenant, members, roles
│   ├── companies/      CRUD, filtros, paginação
│   ├── search/         pesquisa assíncrona, dedup, score
│   ├── leads/          CRM básico, status, atribuição
│   ├── tags/           tags por workspace
│   ├── lists/          listas de leads
│   ├── exports/        CSV com UTF-8 BOM
│   ├── credits/        saldo, transações
│   ├── dashboard/      métricas agregadas
│   ├── admin/          visão SUPER_ADMIN
│   ├── notifications/  notificações in-app
│   └── providers/      interface de fontes de dados
├── shared/
│   ├── database/       cliente Prisma
│   ├── errors/         AppError hierarchy
│   ├── middleware/     auth, workspace resolver, superadmin
│   ├── utils/          normalize, score, audit
│   └── types/          contextos (AuthUser, WorkspaceContext)
├── config/env.ts       variáveis de ambiente tipadas
├── app.ts              buildApp()
└── server.ts           bootstrap
```

## Multi-tenancy

- Toda tabela possui `workspaceId`.
- O frontend envia `x-workspace-id` em cada request.
- O middleware `workspaceResolver` valida membership e role.
- Queries Prisma sempre filtram por `workspaceId`.

## Provider Layer

```
interfaces.ts          CompanySearchProvider, CompanyEnrichmentProvider
primaryProvider.ts     PrimaryCompanyProvider (development, dados fictícios)
providerFactory.ts     Registry (singleton)
```

Adicionar novo provider:
1. Criar classe implementando `CompanySearchProvider`.
2. Registrar em `providerFactory.ts`.
3. Adicionar config em `.env` e na tabela `Provider`.

## Sistema de Créditos

- `CreditBalance`: saldo atual e lifetime por workspace.
- `CreditTransaction`: histórico (SEARCH, ENRICHMENT, EXPORT, BONUS, PURCHASE, REFUND).
- Custo padrão: 1 crédito / empresa pesquisada.
- Em caso de falha, créditos são estornados automaticamente.

## Score

Algoritmo determinístico (configurável via `score.ts`):
- site (+10), telefone (+10), whatsapp (+15), e-mail (+20)
- instagram/facebook (+5 cada)
- rating > 4 (+10), reviews > 100 (+10)
- ativo (+10)
- Classificação: 0-39 Baixo · 40-69 Médio · 70-84 Bom · 85-100 Excelente

## LGPD

- Apenas dados empresariais (B2B).
- Origem registrada em `CompanyDataSource`.
- Cada workspace é um contexto isolado de tratamento.
