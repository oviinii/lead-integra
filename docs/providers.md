# Providers

Arquitetura extensível para fontes de dados de empresas.

## Interface

```ts
interface CompanySearchProvider {
  readonly key: string;
  readonly name: string;
  search(params: CompanySearchParams): Promise<CompanySearchResult[]>;
}

interface CompanyEnrichmentProvider {
  readonly key: string;
  readonly name: string;
  enrich(params: CompanyEnrichmentParams): Promise<CompanyEnrichmentResult>;
}
```

## Adicionando um novo provider

1. Crie `backend/src/modules/providers/myProvider.ts`:

```ts
import { CompanySearchParams, CompanySearchProvider, CompanySearchResult } from "./interfaces";

export class MyProvider implements CompanySearchProvider {
  readonly key = "my-provider";
  readonly name = "My Provider";

  async search(params: CompanySearchParams): Promise<CompanySearchResult[]> {
    // implementar chamada à API oficial, retornando o shape CompanySearchResult.
  }
}
```

2. Registre em `providerFactory.ts`:

```ts
this.searchProviders.push(new MyProvider());
```

3. Configure variáveis de ambiente no `.env`:

```
COMPANY_PROVIDER_API_KEY=...
COMPANY_PROVIDER_BASE_URL=...
```

4. (Opcional) Adicione registros em `Provider` via seed ou admin.

## Provider de desenvolvimento

`PrimaryCompanyProvider` retorna dados determinísticos e fictícios enquanto uma API real não está configurada. Serve apenas para exercitar o restante do sistema (deduplicação, score, persistência).

> Nunca use este provider para coletar dados reais. Quando a API estiver configurada, descomente o bloco `if (this.isConfigured())` em `primaryProvider.ts`.

## Princípios

- Respeitar termos de uso do provedor.
- Não burlar CAPTCHA, rate limit ou autenticação.
- Não coletar dados protegidos por leis locais.
- Manter API keys exclusivamente em `.env` (nunca em código).
- Logs estruturados registrando latência e erros por provedor.
