# TODO — Lead Integra (SaaS Lead Generator)

> **Objetivo**: manter controle de tudo que precisa ser feito, concluído ou está pendente no sistema.

## 📍 Estado Atual (para continuar em outro chat)

**Backend rodando:** `http://localhost:3001` ✅
**Frontend rodando:** `http://localhost:5173` ✅
**Mock OpenWA rodando:** `http://localhost:8000` ✅ (via `nohup node mock-openwa.js`)

**Últimas implementações:**
1. **EnrichmentPage** — Simplificada para **verificação WhatsApp via OpenWA** (apenas isso, sem enriquecimento de email/phone/website)
2. **OpenWA Module** — Backend: `/api/openwa/check`, `/api/openwa/batch-check`, `/api/openwa/status`
3. **Frontend EnrichmentPage** — Barra de progresso, separação leads com/sem WhatsApp, botão verificação em lote + por linha
4. **OpenWA URL** configurada em `.env`: `OPENWA_URL=http://localhost:8000`
5. **Plans CRUD admin** — `PATCH /admin/plans/:id` no backend + página `AdminPlanDetailPage.tsx` + rota `/admin/plans/:id` no frontend

**Para testar WhatsApp:**
1. Mock OpenWA já está rodando em `localhost:8000` (via `nohup node mock-openwa.js`)
   - Para instalar OpenWA real: `brew install colima && colima start` → `docker run -d -p 8000:8000 --security-opt seccomp=unconfined --shm-size=2g openwa/wa-automate`
2. Verificar: `curl http://localhost:8000/status`
3. No frontend: selecionar leads → "Verificar WhatsApp (N)" ou botão refresh por linha

**Credenciais demo:** `demo@lead.local` / `Demo@1234`
**Credenciais admin:** `admin@lead.local` / `Admin@123`

---

## ✅ Concluído (MVP + Enriquecimento)

| Nº | Tarefa | Tipo | Observação |
|----|--------|------|-----------|
| 1 | **Corrigir login** (backend não rodava — faltava `.env`) | Bug | Variáveis de ambiente configuradas e validadas |
| 2 | **Corrigir busca "1 resultado"** (filtro agressivo `BrasilApiProvider`) | Bug | Ajustado para trazer mais resultados realistas |
| 3 | **Corrigir hotéis/pousadas retornando motéis** (tags tourism + exclusão) | Bug | Filtro corrigido para excluir categorias errôneas |
| 4 | **Tema UI preto/vermelho** (`index.css` + `ThemeContext` + hero) | Feature | Tema dark #000000 + primary #ff0000 implementado |
| 5 | **ListsPage** (criar/editar/excluir listas, ver itens, exportar CSV) | Feature | Página completa em `src/pages/lists/ListsPage.tsx` |
| 6 | **Multi-select + "Adicionar à lista"** na `LeadsPage` | Feature | Checkboxes + dialog de adição implementados |
| 7 | **Rotear `/lists` → `ListsPage`** no `App.tsx` | Feature | Rota corrigida (antes apontava para `TagsPage`) |
| 8 | **Dropdown transparente** (`bg-popover` não definido) | Bug | Tokens CSS `--popover`, `--popover-foreground`, `--popover-border` adicionados no `:root` |
| 9 | **Verificar typecheck + lint** (frontend e backend) | Feature | Typecheck passou 100%. Lint: warnings pré-existentes no codebase mas **0 erros**. |
| 10 | **Implementar Enriquecimento** (frontend + backend) | Feature | Backend: módulo `enrichment` com rotas `/enrichment/providers`, `/enrichment/jobs`, `/enrichment/enriched-companies`, `/enrichment/batch`, `/enrichment/companies/:id`. Rotas `/companies/:id/lookup-cnpj` e `PATCH /companies/:id`. `BrasilEnrichmentProvider` com cadeia: BrasilAPI CNPJ → ReceitaWS (token) → Serpro (token) → erro claro. Frontend: `EnrichmentPage.tsx` **simplificada para verificação WhatsApp via OpenWA** (barra de progresso, separação leads com/sem WhatsApp, botão verificação em lote e por linha). `CompanyDetailPage`: "Buscar CNPJ", "Salvar CNPJ", "Enriquecer dados" |
| 11 | **Plans CRUD admin** (`/admin/plans/:id`) | Feature | Backend: `PATCH /admin/plans/:id` em `admin.routes.ts`. Frontend: `AdminPlanDetailPage.tsx` + rota `/admin/plans/:id` no `App.tsx` |
 | 12 | **OpenWA WhatsApp Verification** | Feature | Backend: `/api/openwa/check`, `/api/openwa/batch-check`, `/api/openwa/status`. Frontend: EnrichmentPage com verificação em lote, progresso, botões por linha. Mock OpenWA rodando em localhost:8000 para testes |
| 12a | **Corrigir verificação WhatsApp — persistir resultados no banco** | Bug | Backend: `/batch-check` não salvava resultados → nada acontecia. Agora persiste `whatsapp` + `whatsappVerified` no Company. Frontend: envia `companyId`, botão visível, número clicável abre `wa.me` |

---

## 🔄 Em Andamento

Nenhuma tarefa em andamento no momento.

---

## ⏳ Pendente

### Prioridade Alta

| Nº | Tarefa | Prioridade | Observação |
|----|--------|------------|-----------|
| - | **Corrigir warnings de lint** | Alta | Limpar imports não usados em `AdminLayout.tsx`, `LeadsPage.tsx`, `AdminPlansPage.tsx`, `EnrichmentPage.tsx`, `CompanyDetailPage.tsx`, etc. (94 warnings backend, 111 warnings frontend — 0 erros) |

### Prioridade Média

| Nº | Tarefa | Observação |
|----|--------|-----------|
| 16 | **BullMQ workers** para busca assíncrona (Phase 2) | Backend preparado, mas jobs não rodam assíncronos via queue |
| 17 | **Notificações in-app** | Estrutura no backend (tabelas) mas UI não implementada |
| 18 | **LGPD** — exportação/deleção de dados do lead | Endpoints backend incompletos ou faltando UI |
| 19 | **Integração ReceitaWS** | ReceitaWS caído (DNS). Token configurado mas API caiu. BrasilAPI é fallback principal |

### Prioridade Baixa

| Nº | Tarefa | Observação |
|----|--------|-----------|
| 19 | **Página de ajuda / docs interno** | Guia rápido para usuários. |
| 20 | **Modo escuro automático** (based on system preference) | `prefers-color-scheme`. |
| 21 | **Paginção avançada** em `/leads`, `/search/:id` | `pageSize=50` hardcoded. |
| 22 | **Testes unitários / e2e** | Nenhum teste encontrado no projeto. |
| 23 | **Favicon + PWA** | Só React+Vite básico. |

---

## 📋 Fase 2 (Roadmap — futuro)

| Tarefa | Descrição |
|--------|-----------|
| **Stripe** | Pagamento de créditos, checkout, webhook. |
| **Sentry** | Monitoramento de erros frontend e backend. |
| **Prometheus + Grafana** | Métricas e alertas. |
| **Webhooks** | Emitir eventos para integrações externas. |
| **API Key externa** | Usuários geram tokens de API próprios. |
| **Provider adicional** | Integrar Google Places, Serpro, ou outros. |

---

## 🗂️ Estrutura Atual de Pastas

```
lead-integra/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/             ← LoginPage, RegisterPage
│   │   │   ├── dashboard/        ← DashboardPage
│   │   │   ├── search/           ← SearchPage, SearchResultsPage
│   │   │   ├── leads/            ← LeadsPage (com multi-select + add to list)
│   │   │   ├── lists/            ← ListsPage (novo)
│   │   │   ├── companies/        ← CompanyDetailPage
│   │   │   ├── tags/             ← TagsPage
│   │   │   ├── exports/          ← ExportsPage
│   │   │   ├── admin/            ← Admin*Page (overview, users, plans, etc.)
│   │   │   ├── EnrichmentPage.tsx
│   │   │   ├── IntegrationsPage.tsx
│   │   │   ├── CreditsPage.tsx
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── layout/           ← AppShell, AdminLayout, ProtectedRoute
│   │   │   ├── forms/            ← LocationSelect, etc.
│   │   │   └── ui/               ← shadcn/ui (button, card, badge, dialog, etc.)
│   │   ├── contexts/             ← AuthContext, ThemeContext
│   │   ├── lib/                  ← api.ts, utils.ts
│   │   ├── types/                ← index.ts (Lead, LeadList, Tag, ...)
│   │   ├── styles/               ← index.css (tema dark/red)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             ← login, register, refresh, reset
│   │   │   ├── companies/
│   │   │   ├── leads/
│   │   │   ├── lists/            ← lists.routes.ts, lists.service.ts, lists.schema.ts
│   │   │   ├── tags/
│   │   │   ├── exports/          ← CSV export
│   │   │   ├── search/
│   │   │   ├── credits/
│   │   │   ├── providers/        ← BrasilApiProvider, PrimaryProvider, BrasilEnrichmentProvider, providerFactory
│   │   │   └── admin/            ← overview, users, workspaces, plans, providers, credits, analytics
│   │   ├── shared/
│   │   │   ├── middleware/       ← auth, validate, workspaceResolver
│   │   │   ├── database/         ← prisma client
│   │   │   └── errors/
│   │   ├── app.ts
│   │   └── server.ts
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ✅ Comandos Úteis

```bash
# Frontend
cd frontend
npm run dev          # Vite dev server (http://localhost:5173)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint

# Backend
cd backend
npm run dev          # tsx watch
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run prisma:studio

# OpenWA (para verificação WhatsApp)
node mock-openwa.js                    # Rodar mock OpenWA (localhost:8000)
nohup node mock-openwa.js &            # Rodar mock em background
curl http://localhost:8000/status      # Verificar se OpenWA está rodando

# OpenWA (real - via Docker + Colima)
brew install colima && colima start    # Instalar e iniciar Colimi (VM leve)
docker run -d -p 8000:8000 --security-opt seccomp=unconfined --shm-size=2g openwa/wa-automate

# Docker
docker compose up -d --build

# Banco
npx prisma migrate dev --name nome_da_migracao
npx prisma generate
```

---

## 🔐 Credenciais (seed)

| Tipo       | Email              | Senha     |
|------------|--------------------|-----------|
| Super Admin| admin@lead.local   | Admin@123 |
| Demo       | demo@lead.local    | Demo@1234 |

---

## 🌐 Rotas Importantes

### App principal (protegido)
| Rota            | Página                 |
|-----------------|------------------------|
| `/`             | → redirect /dashboard  |
| `/dashboard`    | Dashboard              |
| `/search`       | SearchPage (nova busca)|
| `/search/:id`   | SearchResultsPage      |
| `/leads`        | LeadsPage              |
| `/lists`        | ListsPage              |
| `/tags`         | TagsPage               |
| `/exports`      | ExportsPage            |
| `/enrichment`   | **EnrichmentPage (WhatsApp verification via OpenWA)**             |
| `/integrations` | IntegrationsPage           |
| `/credits`      | CreditsPage                |
| `/settings`     | SettingsPage               |

### Auth (público)
| Rota            | Página                 |
|-----------------|------------------------|
| `/login`        | LoginPage              |
| `/register`     | RegisterPage           |

### OpenWA (protegido)
| Rota            | Descrição                 |
|-----------------|---------------------------|
| `/api/openwa/check` | Verificar 1 telefone       |
| `/api/openwa/batch-check` | Verificar múltiplos telefones (até 100) |
| `/api/openwa/status` | Status da conexão OpenWA |

### Admin (super-admin)
| Rota                    | Página               |
|-------------------------|----------------------|
| `/admin`                | AdminOverviewPage    |
| `/admin/users`          | AdminUsersPage       |
| `/admin/workspaces`     | AdminWorkspacesPage  |
| `/admin/providers`      | AdminProvidersPage   |
| `/admin/plans`          | AdminPlansPage       |
| `/admin/plans/:id`      | AdminPlanDetailPage    |
| `/admin/credits`        | AdminCreditsPage     |
| `/admin/analytics`      | AdminAnalyticsPage   |
| `/admin/settings`       | AdminSettingsPage    |

---

## 🔧 Demandas Atuais

### 🔴 Pendente (Prioridade Alta)

| Nº | Tarefa | Observação |
|----|--------|-----------|
| 1 | **Dropdown transparente em SearchPage** | Root cause: `tailwind.config.js` falta a cor `popover` → `bg-popover` não gera CSS. Fix: adicionar `popover`/`popover-foreground` ao theme.extend.colors |
| 2 | **Bullet vermelho "Personalizado" fixo no menu da LP** | O `<div className="absolute -top-3 ...">` do plano personalizado na LandingPage está fixo/visível no menu. Investigar z-index ou renderização |
| 3 | **Empresas adicionadas como lead devem aparecer na Enriquecimento** | Leads criados/por lista não filtram para a página de enriquecimento. Verificar query/filtro na EnrichmentPage e backend |
| 4 | **Menu Integrações só para usuários autorizados** | O link `/integrations` aparece para todos. Deve estar condicionado a permissão (ex: isSuperAdmin ou role específico) no AppShell |
| 5 | **Créditos gastos em enriquecimento aparecer na página de créditos/LP** | O consumo de créditos no enriquecimento não reflete na CreditsPage nem na LP. Verificar deduction de créditos no backend + exibição no frontend |
| 6 | **Adicionar ícones e mais cores no sistema** | Revisar uso de lucide-react icônes e aplicar paleta de cores mais viva (primary/vermelho dominante) em cards, badges, botões |

---

## 🚀 Próximas Ações (recomendadas)

1. **Limpeza de lint** — Remover imports não usados e `any` types (94 warnings backend, 111 frontend — 0 erros)
2. **Testar OpenWA** — Acesse `http://localhost:5173/enrichment`, login como `demo@lead.local`, selecione leads e clique "Verificar WhatsApp"
3. **Testar Plans CRUD** — Login como `admin@lead.local`, acesse `/admin/plans`, clique "Editar" em qualquer plano
4. **Verificar servidores** — `cd backend && npm run dev` e `cd frontend && npm run dev`

---

## 🔧 Comandos Úteis

```bash
# Frontend
cd frontend
npm run dev          # Vite dev server (http://localhost:5173)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint

# Backend
cd backend
npm run dev          # tsx watch
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run prisma:studio

# Docker
docker compose up -d --build

# Banco
npx prisma migrate dev --name nome_da_migracao
npx prisma generate
```

---

## 🔐 Credenciais (seed)

| Tipo       | Email              | Senha     |
|------------|--------------------|-----------|
| Super Admin| admin@lead.local   | Admin@123 |
| Demo       | demo@lead.local    | Demo@1234 |
