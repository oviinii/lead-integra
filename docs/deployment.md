# Deploy em VPS

## 1. Provisionar VPS

Recomendações mínimas:
- 2 vCPU, 4 GB RAM, 40 GB SSD
- Ubuntu 22.04 LTS
- Docker + Docker Compose v2 instalados

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 2. Configurar DNS

Aponte `app.seudominio.com` para o IP da VPS.

## 3. Clonar repositório

```bash
git clone <repo>
cd lead-integra
cp .env.example .env
nano .env
```

Gere chaves fortes:
```bash
openssl rand -hex 32
```

## 4. Buildar e subir

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

## 5. Nginx + HTTPS (com Let's Encrypt)

Use `certbot` ou um proxy reverso. Exemplo de configuração Nginx:

```nginx
server {
  server_name app.seudominio.com;

  location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d app.seudominio.com
```

## 6. Backups

```bash
docker compose exec postgres pg_dump -U leaduser leadgenerator > backup.sql
```

Automatize com cron.

## 7. Updates

```bash
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

## 8. Logs e monitoramento

```bash
docker compose logs -f --tail=100
```

Integrações futuras: Sentry, Prometheus, Grafana.
