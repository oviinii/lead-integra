import { env } from "@/config/env";
import { AppError } from "@/shared/errors/AppError";
import {
  CompanyEnrichmentParams,
  CompanyEnrichmentProvider,
  CompanyEnrichmentResult,
  CompanySearchParams,
  CompanySearchProvider,
  CompanySearchResult,
} from "./interfaces";

/**
 * Primary Provider. Calls a real data source API when configured.
 * Throws an actionable error when no API key / base URL are configured.
 */
export class PrimaryCompanyProvider implements CompanySearchProvider {
  readonly key = "primary";
  readonly name = "Primary Provider";

  private isConfigured(): boolean {
    return Boolean(env.COMPANY_PROVIDER_API_KEY && env.COMPANY_PROVIDER_BASE_URL);
  }

  async search(params: CompanySearchParams): Promise<CompanySearchResult[]> {
    if (!this.isConfigured()) {
      throw new AppError(
        "Nenhuma fonte de dados está configurada. Configure COMPANY_PROVIDER_API_KEY e COMPANY_PROVIDER_BASE_URL.",
        501,
        "PROVIDER_NOT_CONFIGURED",
      );
    }

    const url = new URL(`${env.COMPANY_PROVIDER_BASE_URL}/search`);
    url.searchParams.set("q", params.keyword);
    if (params.country) url.searchParams.set("country", params.country);
    if (params.state) url.searchParams.set("state", params.state);
    if (params.region) url.searchParams.set("region", params.region);
    if (params.city) url.searchParams.set("city", params.city);
    if (params.neighborhood) url.searchParams.set("neighborhood", params.neighborhood);
    if (params.postalCode) url.searchParams.set("postalCode", params.postalCode);
    if (params.radiusKm) url.searchParams.set("radiusKm", String(params.radiusKm));
    if (params.category) url.searchParams.set("category", params.category);
    url.searchParams.set("limit", String(params.quantity));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.COMPANY_PROVIDER_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AppError(
        `Falha ao consultar a fonte de dados (${res.status})`,
        502,
        "PROVIDER_ERROR",
        { detail: text.slice(0, 200) },
      );
    }

    const payload = (await res.json()) as {
      results?: unknown[];
      data?: unknown[];
      items?: unknown[];
      businesses?: unknown[];
      items_per_page?: number;
    };

    const rawList: unknown[] = payload.results ?? payload.data ?? payload.items ?? payload.businesses ?? [];
    return rawList.map((item) => this.mapToCompanyResult(item));
  }

  private mapToCompanyResult(item: unknown): CompanySearchResult {
    const r = (item ?? {}) as Record<string, unknown>;
    const get = (k: string, fallback?: string) =>
      typeof r[k] === "string" ? r[k] : fallback;

    return {
      externalId: get("id") ?? get("externalId"),
      name: get("name") ?? get("displayName") ?? "Empresa sem nome",
      legalName: get("legalName") ?? get("razaoSocial"),
      document: get("document") ?? get("cnpj"),
      category: get("category") ?? get("categoryName") ?? get("tipo"),
      description: get("description") ?? get("bio") ?? get("descricao"),
      phone: get("phone") ?? get("phone_number") ?? get("telefone"),
      whatsapp: get("whatsapp") ?? get("whatsappLink"),
      email: get("email") ?? get("email_address"),
      website: get("website") ?? get("site") ?? get("siteUrl"),
      instagram: get("instagram"),
      facebook: get("facebook"),
      linkedin: get("linkedin"),
      address: get("address") ?? get("street") ?? get("endereco"),
      neighborhood: get("neighborhood") ?? get("bairro") ?? get("neighborhoodName"),
      city: get("city") ?? get("cidade"),
      state: get("state") ?? get("estado") ?? get("stateCode"),
      country: get("country") ?? get("pais"),
      postalCode: get("postalCode") ?? get("cep") ?? get("zip"),
      latitude: typeof r.latitude === "number" ? r.latitude : typeof r.lat === "number" ? r.lat : undefined,
      longitude: typeof r.longitude === "number" ? r.longitude : typeof r.lon === "number" ? r.lon : undefined,
      rating: typeof r.rating === "number" ? r.rating : typeof r.stars === "number" ? r.stars : undefined,
      reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : typeof r.review_count === "number" ? r.review_count : undefined,
      isActive: typeof r.isActive === "boolean" ? r.isActive : true,
      source: "primary",
      sourceUrl: get("sourceUrl") ?? get("url"),
      raw: r,
    };
  }
}

export class PrimaryEnrichmentProvider implements CompanyEnrichmentProvider {
  readonly key = "primary";
  readonly name = "Primary Enrichment Provider";

  async enrich(params: CompanyEnrichmentParams): Promise<CompanyEnrichmentResult> {
    if (!env.COMPANY_PROVIDER_API_KEY || !env.COMPANY_PROVIDER_BASE_URL) {
      throw new AppError(
        "Nenhum provider de enriquecimento está configurado.",
        501,
        "ENRICHMENT_PROVIDER_NOT_CONFIGURED",
      );
    }

    const c = params.company;
    const searchParams = new URLSearchParams();
    if (c.email) searchParams.set("email", c.email);
    if (c.phone) searchParams.set("phone", c.phone);
    if (c.website) searchParams.set("domain", c.website.replace(/^https?:\/\//, "").replace(/^www\./, ""));

    const res = await fetch(`${env.COMPANY_PROVIDER_BASE_URL}/enrich?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${env.COMPANY_PROVIDER_API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new AppError(`Enriquecimento falhou (${res.status})`, 502, "ENRICHMENT_ERROR");
    return (await res.json()) as CompanyEnrichmentResult;
  }
}
