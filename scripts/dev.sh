#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "==> Subindo backend..."
nohup env \
  DATABASE_URL="postgresql://leaduser:leadpass@localhost:5432/leadgenerator" \
  REDIS_URL="redis://localhost:6379" \
  PORT=3001 \
  CORS_ORIGIN="http://localhost:5173" \
  JWT_SECRET="dev-secret-with-at-least-32-characters-long" \
  JWT_REFRESH_SECRET="dev-refresh-with-at-least-32-characters-long-app-32c" \
  LOG_LEVEL=info \
  NODE_ENV=development \
  npx tsx watch src/server.ts > /tmp/backend.log 2>&1 &

echo "==> Subindo frontend..."
cd ../frontend
nohup env VITE_API_URL="http://localhost:3001" npx vite > /tmp/frontend.log 2>&1 &

echo
echo "Pronto! Acesse: http://localhost:5173"
echo "Credenciais: demo@lead.local / Demo@1234"
