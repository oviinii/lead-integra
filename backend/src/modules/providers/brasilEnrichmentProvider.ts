import { AppError } from "@/shared/errors/AppError";
import { env } from "@/config/env";
import {
  CompanyEnrichmentProvider,
  CompanyEnrichmentParams,
  CompanyEnrichmentResult,
} from "./interfaces";

/**
 * Enrichment provider that:
 * 1. Tries BrasilAPI CNPJ lookup (free, by CNPJ)
 * 2. Falls back to Serpro CNPJ search (by name + city) if configured
 */
export class BrasilEnrichmentProvider implements CompanyEnrichmentProvider {
  readonly key = "brasilapi";
  readonly name = "BrasilAPI Enrichment (Gratuito)";

  async enrich(params: CompanyEnrichmentParams): Promise<CompanyEnrichmentResult> {
    const { company, fields } = params;
    const result: CompanyEnrichmentResult = { fields: {} };

    const cnpj = extractCnpj(company);

    if (!cnpj) {
      const receitaResult = await tryReceitaWsSearch(company, fields);
      if (receitaResult) return receitaResult;

      const serproResult = await trySerproSearch(company, fields);
      if (serproResult) return serproResult;

      throw new AppError(
        "Não foi possível enriquecer este lead: não encontramos CNPJ ou empresa correspondente. Soluções:\n" +
        "1. Salve um CNPJ válido na empresa (brasilapi.com.br - grátis)\n" +
        "2. Configure SERPRO_TOKEN ou RECEITAWS_TOKEN para busca automática\n" +
        "3. A empresa não está em bases públicas",
        422,
        "CNPJ_REQUIRED",
      );
    }

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = (await res.json()) as Record<string, any>;
        if (data.email && fields.includes("email")) {
          result.fields.email = { value: data.email, source: "brasilapi", confidence: 0.8 };
        }
        if (data.telefone_principal?.numero) {
          if (fields.includes("phone")) {
            result.fields.phone = { value: data.telefone_principal.numero, source: "brasilapi", confidence: 0.9 };
          }
          if (fields.includes("whatsapp")) {
            result.fields.whatsapp = { value: data.telefone_principal.numero, source: "brasilapi", confidence: 0.7 };
          }
        }
      }
    } catch {
      // best-effort
    }

    if (Object.keys(result.fields).length === 0) {
      throw new AppError(
        "Não foi possível enriquecer este lead. Verifique se o CNPJ está correto e tente novamente.",
        502,
        "ENRICHMENT_FAILED",
      );
    }

    return result;
  }
}

/**
 * Try to search CNPJ via ReceitaWS API (free, by name + city).
 * Requires RECEITAWS_TOKEN env var. Falls back gracefully.
 */
async function tryReceitaWsSearch(
  company: CompanyEnrichmentParams["company"],
  fields: string[],
): Promise<CompanyEnrichmentResult | null> {
  if (!env.RECEITAWS_TOKEN) return null;
  if (!company.name) return null;

  const endpoints = [
    "https://api.receitaws.com.br/v1/cnpj",
    "https://www.receitaws.com.br/v1/cnpj",
  ];

  for (const baseUrl of endpoints) {
    try {
      const searchParams = new URLSearchParams({
        nome: company.name,
        ...(company.city ? { cidade: company.city } : {}),
        ...(company.state ? { uf: company.state } : {}),
      });

      const res = await fetch(`${baseUrl}?${searchParams}`, {
        headers: { Authorization: `Bearer ${env.RECEITAWS_TOKEN}` },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const data = await res.json() as Record<string, any>;
      const results = Array.isArray(data) ? data : data.resultados || data.empreses || [];
      if (!results.length) continue;

      const best = results[0];
      const result: CompanyEnrichmentResult = { fields: {} };

      if (fields.includes("email") && best.email) {
        result.fields.email = { value: best.email, source: "receitaws", confidence: 0.9 };
      }
      if (fields.includes("phone") && (best.telefone || best.telefone_principal?.numero)) {
        result.fields.phone = { value: best.telefone || best.telefone_principal?.numero, source: "receitaws", confidence: 0.95 };
      }
      if (fields.includes("whatsapp") && best.whatsapp) {
        result.fields.whatsapp = { value: best.whatsapp, source: "receitaws", confidence: 0.8 };
      }
      if (fields.includes("website") && best.site) {
        result.fields.website = { value: best.site, source: "receitaws", confidence: 0.9 };
      }

      if (Object.keys(result.fields).length > 0) return result;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Try to search CNPJ via Serpro's "Busca de Empresas" API.
 * Requires SERPRO_TOKEN and SERPRO_BASE_URL env vars.
 */
async function trySerproSearch(
  company: CompanyEnrichmentParams["company"],
  fields: string[],
): Promise<CompanyEnrichmentResult | null> {
  if (!env.SERPRO_TOKEN || !env.SERPRO_BASE_URL) return null;
  if (!company.name || !company.city) return null;

  try {
    const url = new URL(`${env.SERPRO_BASE_URL}/cnpj/v1/empresas`);
    url.searchParams.set("nome", company.name);
    if (company.city) url.searchParams.set("municipio", company.city);
    if (company.state) url.searchParams.set("uf", company.state);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${env.SERPRO_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json() as Record<string, any>;
    const results = data.empresas || data.results || [];
    if (!results.length) return null;

    const best = results[0];
    const result: CompanyEnrichmentResult = { fields: {} };

    if (fields.includes("email") && best.email) {
      result.fields.email = { value: best.email, source: "serpro", confidence: 0.9 };
    }
    if (fields.includes("phone") && best.telefone_principal?.numero) {
      result.fields.phone = { value: best.telefone_principal.numero, source: "serpro", confidence: 0.95 };
    }
    if (fields.includes("whatsapp") && best.whatsapp) {
      result.fields.whatsapp = { value: best.whatsapp, source: "serpro", confidence: 0.8 };
    }
    if (fields.includes("website") && best.site) {
      result.fields.website = { value: best.site, source: "serpro", confidence: 0.9 };
    }

    return Object.keys(result.fields).length > 0 ? result : null;
  } catch {
    return null;
  }
}

function extractCnpj(
  company: { document?: string | null; website?: string | null; raw?: unknown; phone?: string | null },
): string | null {
  if (company.document) {
    const digits = company.document.replace(/\D/g, "");
    if (digits.length === 14) return digits;
  }

  if (company.raw) {
    const rawStr = JSON.stringify(company.raw);
    const match = rawStr.match(/["']?cnpj["']?\s*[:=]\s*["']?(\d{14})["']?/i);
    if (match) return match[1];
  }

  if (company.website) {
    const digits = company.website.replace(/\D/g, "");
    if (digits.length === 14) return digits;
  }

  if (company.phone) {
    const digits = company.phone.replace(/\D/g, "");
    if (digits.length === 14) return digits;
  }

  return null;
}
