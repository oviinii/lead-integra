# Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | `development` \| `production` | `development` |
| `PORT` | Porta da API | `3001` |
| `HOST` | Host da API | `0.0.0.0` |
| `API_URL` | URL pública da API | `http://localhost:3001` |
| `APP_URL` | URL pública do frontend | `http://localhost:5173` |
| `CORS_ORIGIN` | Origens permitidas (CSV) | `http://localhost:5173` |
| `DATABASE_URL` | Postgres connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Segredo JWT (32+ chars) | - |
| `JWT_EXPIRES_IN` | Expiração access token | `7d` |
| `JWT_REFRESH_SECRET` | Segredo refresh | - |
| `JWT_REFRESH_EXPIRES_IN` | Expiração refresh | `30d` |
| `COMPANY_PROVIDER_API_KEY` | API key do provider | - |
| `COMPANY_PROVIDER_BASE_URL` | Base URL do provider | - |
| `MAP_PROVIDER_API_KEY` | Chave do mapa | - |
| `MAP_PROVIDER` | Provider de mapa | `openstreetmap` |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | E-mail transacional | - |
| `LOG_LEVEL` | Nível de log | `info` |
| `SENTRY_DSN` | DSN do Sentry | - |
| `RATE_LIMIT_MAX` | Limite de requests | `100` |
| `RATE_LIMIT_WINDOW` | Janela | `1 minute` |
| `APP_PLAN_*_CREDITS` | Créditos iniciais por plano | 100/1000/5000/50000 |

## Segurança

- NUNCA commitar `.env`.
- Gere `JWT_SECRET` e `JWT_REFRESH_SECRET` com `openssl rand -hex 32`.
- Em produção, defina `NODE_ENV=production`.
