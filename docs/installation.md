# Instalação

## Requisitos

- Docker + Docker Compose
- Node.js 20+ (apenas para dev local sem Docker)

## 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: gere chaves fortes (32+ caracteres).
- `DATABASE_URL`, `REDIS_URL`: devem apontar para os containers.

## 2. Subir containers

```bash
docker compose up -d
```

Serviços:
- `lead-postgres` (5432)
- `lead-redis` (6379)
- `lead-backend` (3001)
- `lead-worker`
- `lead-frontend` (5173)

## 3. Migrations e Seed

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

## 4. Acessar

- Frontend: http://localhost:5173
- API: http://localhost:3001/health

Credenciais:
- Super Admin: `admin@lead.local` / `Admin@123`
- Demo: `demo@lead.local` / `Demo@1234`

## 5. Logs

```bash
docker compose logs -f backend
```

## 6. Parar tudo

```bash
docker compose down
# Para remover volumes:
docker compose down -v
```
