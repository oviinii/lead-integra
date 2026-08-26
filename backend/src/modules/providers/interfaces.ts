export interface CompanySearchParams {
  keyword: string;
  country?: string;
  state?: string;
  region?: string;
  city?: string;
  neighborhood?: string;
  postalCode?: string;
  radiusKm?: number;
  category?: string;
  quantity: number;
}

export interface CompanySearchResult {
  externalId?: string;
  name: string;
  legalName?: string;
  document?: string;
  category?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  businessHours?: unknown;
  source: string;
  sourceUrl?: string;
  raw?: unknown;
}

export interface CompanyEnrichmentParams {
  company: {
    name: string;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    document?: string | null;
    raw?: unknown;
  };
  fields: Array<"email" | "phone" | "whatsapp" | "website" | "social">;
}

export interface CompanyEnrichmentResult {
  fields: Record<string, { value: string; source: string; confidence?: number }>;
}

export interface CompanySearchProvider {
  readonly key: string;
  readonly name: string;
  search(params: CompanySearchParams): Promise<CompanySearchResult[]>;
}

export interface CompanyEnrichmentProvider {
  readonly key: string;
  readonly name: string;
  enrich(params: CompanyEnrichmentParams): Promise<CompanyEnrichmentResult>;
}

export interface ProviderRegistry {
  searchProviders(): CompanySearchProvider[];
  enrichmentProviders(): CompanyEnrichmentProvider[];
  getSearchProvider(key: string): CompanySearchProvider | undefined;
  getEnrichmentProvider(key: string): CompanyEnrichmentProvider | undefined;
}
