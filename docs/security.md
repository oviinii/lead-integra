# Segurança

## Implementado

- **Senhas**: `argon2id` com parâmetros seguros.
- **Tokens**: JWT (HS256) + refresh tokens persistidos em `RefreshToken` (hash SHA-256).
- **Validação**: `zod` em todos os endpoints públicos.
- **Helmet**: cabeçalhos HTTP seguros.
- **CORS**: origens configuráveis via `CORS_ORIGIN`.
- **Rate limit**: configurável (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW`).
- **RBAC**: roles `OWNER > ADMIN > MEMBER > VIEWER`.
- **Multi-tenancy**: `workspaceResolver` valida membership a cada request.
- **SQL injection**: 100% via Prisma ORM.
- **Tratamento de erros**: mensagens amigáveis em produção; detalhes só em dev.
- **Auditoria**: `AuditLog` para ações sensíveis.

## Boas práticas adotadas

- Variáveis sensíveis apenas em `.env` (não commitadas).
- `passwordHash`, `tokenHash`, chaves de API nunca retornados pela API.
- Tokens de refresh são revogáveis (`revokedAt`).
- Logout revoga todos os refresh tokens do usuário.
- Senhas alteradas invalidam sessões ativas.

## Pendente (próximas fases)

- Sentry para captura de exceções em produção.
- Prometheus / Grafana para métricas.
- Auditoria de IP/UA em todas as ações sensíveis.
- MFA (TOTP) opcional.
- Criptografia em repouso para `CompanyDataSource.raw`.
- Política de retenção (LGPD).

## LGPD

- Sistema armazena apenas dados empresariais (B2B).
- Origem dos dados registrada por campo.
- Isolamento por workspace.
- Estrutura preparada para `data deletion` e `data export` por usuário/workspace.
