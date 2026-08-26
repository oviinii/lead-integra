# Lead Generator SaaS

Plataforma profissional de geração, pesquisa, enriquecimento e organização de leads B2B. Multi-tenant, modular, pronta para produção em VPS.

![status](https://img.shields.io/badge/status-mvp-success) ![license](https://img.shields.io/badge/license-proprietary-blue)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Hook Form + Zod |
| Backend | Node.js 20 + Fastify + TypeScript + Prisma 5 |
| Banco | PostgreSQL 16 |
| Cache/Queue | Redis 7 (BullMQ preparado) |
| Auth | JWT (HS256) + Refresh Tokens persistidos (Argon2id) |
| Container | Docker + Docker Compose |
| Nginx + HTTPS | pronto para Let's Encrypt |

## Funcionalidades Implementadas

- **Autenticação completa**: cadastro, login, logout, refresh, recuperação de senha, troca de senha.
- **Multi-tenant**: workspaces, papéis (OWNER, ADMIN, MEMBER, VIEWER), isolamento por `workspaceId`.
- **Pesquisa de empresas**: formulário completo (segmento, país, estado, região, cidade, bairro, categoria, quantidade).
- **Provider Layer extensível**: `CompanySearchProvider` interface; `PrimaryCompanyProvider` para dev com dados fictícios; pronto para integrar providers reais.
- **Deduplicação**: por (workspaceId, externalId, source), CNPJ, domínio e telefone normalizado.
- **Lead Score**: 0-100 com classificação Baixo/Médio/Bom/Excelente.
- **CRM**: leads com status, tags, listas, atribuição.
- **Tags e Listas**: N:N entre leads e tags/listas.
- **Exportação CSV**: UTF-8 com BOM (compatível Excel).
- **Sistema de Créditos**: saldo, histórico, cobrança por pesquisa, estorno em falha.
- **Admin**: visão SUPER_ADMIN com overview, usuários, workspaces e providers.
- **Dashboard**: métricas agregadas com gráficos de qualidade.
- **Notificações in-app**: estrutura pronta.
- **LGPD**: dados empresariais, registro de origem (`CompanyDataSource`), estrutura para data deletion/export.

## Estrutura do Projeto

```
lead-integra/
├── frontend/            # React + Vite + TypeScript
├── backend/             # Fastify + Prisma + TS
├── docs/                # Documentação
├── scripts/             # setup-vps.sh, deploy-vps.sh
├── docker-compose.yml   # Postgres + Redis + Backend + Worker + Frontend + Nginx
└── .env.example
```

## Quickstart (Docker)

```bash
cp .env.example .env
# edite JWT_SECRET e JWT_REFRESH_SECRET (use: openssl rand -hex 32)

docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

Acessos:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Credenciais do seed:
| Tipo | Email | Senha |
|------|-------|-------|
| Super Admin | admin@lead.local | Admin@123 |
| Demo | demo@lead.local | Demo@1234 |

## Quickstart (sem Docker, dev local)

Requisitos: Node 20+, PostgreSQL 16, Redis 7.

```bash
# Backend
cd backend
npm install
export DATABASE_URL="postgresql://leaduser:leadpass@localhost:5432/leadgenerator"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
npx prisma migrate deploy
npm run seed
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

## Deploy em VPS

```bash
# Na VPS:
git clone <repo> && cd lead-integra
./scripts/setup-vps.sh
```

Para HTTPS, instale `certbot` e use o `docs/deployment.md` como guia.

## Documentação

- [Arquitetura](./docs/architecture.md)
- [Instalação](./docs/installation.md)
- [API](./docs/api.md)
- [Banco de Dados](./docs/database.md)
- [Providers](./docs/providers.md)
- [Segurança](./docs/security.md)
- [Deploy](./docs/deployment.md)
- [Variáveis de Ambiente](./docs/environment.md)

## Princípios

- **Sem scraping malicioso**: o sistema usa provedores oficiais via API. O Provider Layer é desenhado para aceitar integrações autorizadas.
- **API Keys em .env**: nenhuma credencial hardcoded.
- **Multi-tenant obrigatório**: isolamento validado em todo request.
- **LGPD**: apenas dados empresariais, origem registrada.
- **Arquitetura extensível**: adicionar um novo provider ou worker não exige refatoração.

## Próximas Fases

- BullMQ real + workers para pesquisas longas (Fase 2)
- Enriquecimento assíncrono (Fase 6)
- Pagamentos/Stripe (Fase 7)
- Sentry + Prometheus + Grafana (Fase 8)
