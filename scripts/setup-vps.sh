#!/usr/bin/env bash
# Setup inicial em VPS Ubuntu 22.04
set -euo pipefail

echo "==> Instalando Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Reinicie a sessão para usar docker sem sudo."
fi

echo "==> Instalando Docker Compose v2"
if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

echo "==> Clonando projeto"
if [ ! -d lead-integra ]; then
  git clone https://github.com/oviinii/lead-integra.git lead-integra
fi

cd lead-integra

if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "ATENÇÃO: edite .env e gere JWT_SECRET com: openssl rand -hex 32"
fi

echo "==> Subindo"
./scripts/deploy-vps.sh
