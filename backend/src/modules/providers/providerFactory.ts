import {
  CompanyEnrichmentProvider,
  CompanySearchProvider,
  ProviderRegistry,
} from "./interfaces";
import { PrimaryCompanyProvider, PrimaryEnrichmentProvider } from "./primaryProvider";
import { BrasilApiProvider } from "./brasilApiProvider";
import { BrasilEnrichmentProvider } from "./brasilEnrichmentProvider";
import { env } from "@/config/env";

class InMemoryProviderRegistry implements ProviderRegistry {
  private search: CompanySearchProvider[] = [];
  private enrichment: CompanyEnrichmentProvider[] = [];

  constructor() {
    // Free / always available (BrasilAPI / OSM)
    this.search.push(new BrasilApiProvider());
    this.enrichment.push(new BrasilEnrichmentProvider());

    // Primary (configured real provider) — only if env vars are set
    if (env.COMPANY_PROVIDER_API_KEY && env.COMPANY_PROVIDER_BASE_URL) {
      this.search.push(new PrimaryCompanyProvider());
      this.enrichment.push(new PrimaryEnrichmentProvider());
    }
  }

  searchProviders() {
    return [...this.search];
  }

  enrichmentProviders() {
    return [...this.enrichment];
  }

  getSearchProvider(key: string) {
    return this.search.find((p) => p.key === key);
  }

  getEnrichmentProvider(key: string) {
    return this.enrichment.find((p) => p.key === key);
  }
}

export const providerRegistry: ProviderRegistry = new InMemoryProviderRegistry();
