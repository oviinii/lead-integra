#!/usr/bin/env bash
# =====================================================
# VPS Deploy Script
# Uso: ./scripts/deploy-vps.sh
# =====================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> 1. Verificando .env"
if [ ! -f .env ]; then
  echo "ERRO: .env não encontrado. Copie .env.example."
  exit 1
fi

echo "==> 2. Build + start (force-recreate to pick up .env changes)"
docker compose up -d --build --force-recreate

echo "==> 3. Aguardando Postgres..."
until docker compose exec -T postgres pg_isready -U leaduser -d leadgenerator >/dev/null 2>&1; do
  sleep 2
done

echo "==> 4. Migrations"
docker compose exec -T backend npx prisma migrate deploy

echo "==> 5. Seed (idempotente)"
docker compose exec -T backend npm run seed

echo "==> 6. Healthcheck"
sleep 3
curl -fs http://localhost:3001/health && echo " ✓ backend OK"
curl -fs -o /dev/null http://localhost:5173/ && echo " ✓ frontend OK"

echo
echo "Deploy concluído."
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:3001"
echo "- Super Admin: admin@lead.local / Admin@123"
echo "- Demo:        demo@lead.local / Demo@1234"
