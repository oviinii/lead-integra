import { AppError } from "@/shared/errors/AppError";
import {
  CompanyEnrichmentParams,
  CompanyEnrichmentProvider,
  CompanyEnrichmentResult,
  CompanySearchProvider,
  CompanySearchParams,
  CompanySearchResult,
} from "./interfaces";

/**
 * Free provider that queries OpenStreetMap Overpass API + Nominatim geocoder.
 * Requires NO API key. Respects Overpass public usage policy.
 *
 * Strategy:
 *  1. Geocode the city → lat/lon.
 *  2. Use Overpass to find business POIs by relevant amenity/shop tags.
 *  3. Filter by keyword (in name or category).
 */
export class BrasilApiProvider implements CompanySearchProvider {
  readonly key = "brasilapi";
  readonly name = "OpenStreetMap (Gratuito)";

  // Map of keyword patterns → relevant OSM amenity/shop/tourism values.
  private static readonly KEYWORD_TAGS: Array<{
    match: RegExp;
    amenities?: string[];
    shops?: string[];
    leisure?: string[];
    tourisms?: string[];
  }> = [
    { match: /clin|dentis|hospital|saud|medic|consult|doutor/, amenities: ["clinic", "dentist", "doctors", "hospital"] },
    { match: /restaur|comid|food|lanche|pizza|cafe|bar|hamburg/, amenities: ["restaurant", "cafe", "bar", "fast_food", "food_court"] },
    { match: /academ|gym|fitness|cross|muscula|treino/, amenities: ["fitness_centre", "sports_centre"], leisure: ["fitness_centre", "sports_centre"] },
    { match: /escola|coleg|educa|univer|faculdade/, amenities: ["school", "university", "college", "kindergarten"] },
    // Accommodation: prefer the `tourism` taxonomy (hotels/pousadas). `amenity` tags are
    // kept for legacy data; motels/love_hotels are excluded in the result loop so they
    // don't leak into hotel/pousada results via substring tag matching.
    {
      match: /hotel|pousada|hostel|hosped/,
      tourisms: ["hotel", "guest_house", "hostel", "chalet", "alpine_hut"],
      amenities: ["hotel", "guest_house", "hostel"],
    },
    { match: /oficina|mecanic|auto|carro/, amenities: ["car_repair", "car_wash", "fuel"] },
     { match: /mercado|supermerc|mercearia|hortifrut/, shops: ["supermarket", "convenience", "greengrocer"] },
     { match: /padaria|bakery|boulang/, shops: ["bakery"] },
     { match: /farmacia|drogaria/, amenities: ["pharmacy"] },
    { match: /banco|financeira/, amenities: ["bank", "atm"] },
    { match: /pet|animal|veterinar/, amenities: ["veterinary"], shops: ["pet"] },
    { match: /salão|salao|beleza|barber|cabeleir|estetic/, shops: ["beauty", "hairdresser"] },
    { match: /loja|roupa|vestuar|moda/, shops: ["clothes", "shoes", "boutique"] },
    { match: /constru|reform|material/, shops: ["hardware", "doityourself", "building_materials"] },
  ];

  async search(params: CompanySearchParams): Promise<CompanySearchResult[]> {
    const keyword = params.keyword.trim();
    const state = (params.state || "").toUpperCase();
    const cityRaw = (params.city || "").trim();

    let latitude: number | undefined;
    let longitude: number | undefined;
    let cityNormalized = cityRaw;

    // Step 1: geocode city
    if (cityRaw) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          `${cityRaw}, ${state || ""}, Brasil`,
        )}`;
        const geoRes = await fetch(geoUrl, {
          headers: { "User-Agent": "lead-generator/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (geoRes.ok) {
          const geoData = (await geoRes.json()) as Array<{
            lat: string;
            lon: string;
            address?: Record<string, string>;
          }>;
          if (geoData.length > 0) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
            cityNormalized =
              geoData[0].address?.city || geoData[0].address?.town || cityRaw;
          }
        }
      } catch {
        // geocode is best-effort
      }
    }

    if (latitude === undefined || longitude === undefined) {
      throw new AppError(
        "Não foi possível localizar a cidade. Verifique o nome e o estado.",
        400,
        "GEOCODE_FAILED",
      );
    }

    // Step 2: build Overpass query based on keyword
    const radius = Math.min(params.radiusKm ? params.radiusKm * 1000 : 5000, 50000);
    const kw = keyword.toLowerCase();

    // Find relevant OSM tags for this keyword
    let amenitiesToQuery: string[] = [];
    let shopsToQuery: string[] = [];
    let leisureToQuery: string[] = [];
    let tourismsToQuery: string[] = [];
    for (const rule of BrasilApiProvider.KEYWORD_TAGS) {
      if (rule.match.test(kw)) {
        if (rule.amenities) amenitiesToQuery = amenitiesToQuery.concat(rule.amenities);
        if (rule.shops) shopsToQuery = shopsToQuery.concat(rule.shops);
        if (rule.leisure) leisureToQuery = leisureToQuery.concat(rule.leisure);
        if (rule.tourisms) tourismsToQuery = tourismsToQuery.concat(rule.tourisms);
      }
    }

    // If no match found, fallback to broad search (any amenity or shop)
    if (
      amenitiesToQuery.length === 0 &&
      shopsToQuery.length === 0 &&
      leisureToQuery.length === 0 &&
      tourismsToQuery.length === 0
    ) {
      amenitiesToQuery = ["clinic", "restaurant", "school", "bank", "pharmacy", "doctors", "dentist", "veterinary", "hairdresser", "beauty"];
      shopsToQuery = ["supermarket", "convenience", "greengrocer", "bakery", "clothes", "shoes", "hardware", "pet", "books"];
    }

    const tourismsRegex = tourismsToQuery.join("|");
    const amenitiesRegex = amenitiesToQuery.join("|");
    const shopsRegex = shopsToQuery.join("|");
    const leisureRegex = leisureToQuery.join("|");
    // tourism values are standardized single words → anchor to avoid substring matches
    // (e.g. "motel" must not match a tourism=motel query meant for hotels).
    const tourismBlock = tourismsToQuery.length
      ? `node["tourism"~"^(${tourismsRegex})$"](around:${radius},${latitude},${longitude});way["tourism"~"^(${tourismsRegex})$"](around:${radius},${latitude},${longitude});`
      : "";
    const amenityBlock = amenitiesToQuery.length
      ? `node["amenity"~"${amenitiesRegex}"](around:${radius},${latitude},${longitude});way["amenity"~"${amenitiesRegex}"](around:${radius},${latitude},${longitude});`
      : "";
    const shopBlock = shopsToQuery.length
      ? `node["shop"~"${shopsRegex}"](around:${radius},${latitude},${longitude});way["shop"~"${shopsRegex}"](around:${radius},${latitude},${longitude});`
      : "";
    const leisureBlock = leisureToQuery.length
      ? `node["leisure"~"${leisureRegex}"](around:${radius},${latitude},${longitude});way["leisure"~"${leisureRegex}"](around:${radius},${latitude},${longitude});`
      : "";

    const query = `[out:json][timeout:20];(${tourismBlock}${amenityBlock}${shopBlock}${leisureBlock});out center;`;

    try {
      const overpassUrl =
        "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
      const overRes = await fetch(overpassUrl, {
        headers: { "User-Agent": "lead-generator/1.0" },
        signal: AbortSignal.timeout(28000),
      });

      if (!overRes.ok)
        throw new AppError(
          "Fonte de dados temporariamente indisponível. Tente novamente em instantes.",
          502,
          "PROVIDER_ERROR",
        );

      const overData = (await overRes.json()) as { elements?: any[] };
      const elements: any[] = Array.isArray(overData.elements) ? overData.elements : [];

      const results: CompanySearchResult[] = [];
      const seen = new Set<string>();
      const scored: Array<{ result: CompanySearchResult; relevance: number }> = [];

      for (const el of elements) {
        const tags: Record<string, string> = (el.tags as Record<string, string>) || {};
        const name = tags.name || tags.brand || tags.ref || "";
        if (!name) continue;

        // Exclude motels/love_hotels so accommodation searches return real hotels &
        // pousadas, not motéis. (love_hotel leaks via the unanchored amenity~"hotel".)
        if (tags.tourism === "motel" || tags.amenity === "love_hotel" || tags.amenity === "motel") continue;

        // Dedup by externalId
        const extId = el.id !== undefined ? `osm-${el.id}` : name;
        if (seen.has(extId)) continue;
        seen.add(extId);

        const result: CompanySearchResult = {
          externalId: el.id !== undefined ? `osm-${el.id}` : undefined,
          name,
          legalName: tags["name:legal"] || tags.name,
          category: tags.shop || tags.amenity || tags.office || params.category || keyword,
          description: tags.description,
          phone: normalizeOsmPhone(tags.phone),
          whatsapp: normalizeOsmPhone(tags["contact:whatsapp"]),
          email: tags.email,
          website: tags.website || tags["contact:website"],
          instagram: tags["contact:instagram"],
          facebook: tags["contact:facebook"],
          address: buildOsmAddress(tags),
          neighborhood: tags["addr:neighbourhood"] || tags["addr:suburb"],
          city: cityNormalized || tags["addr:city"] || "",
          state,
          country: params.country || "Brasil",
          postalCode: tags["addr:postcode"],
          latitude: typeof el.lat === "number" ? el.lat : latitude,
          longitude: typeof el.lon === "number" ? el.lon : longitude,
          rating: tags["rating"] ? parseFloat(tags["rating"]) : undefined,
          source: "openstreetmap",
          sourceUrl: `https://www.openstreetmap.org/${el.type || "node"}/${el.id || ""}`,
          isActive: true,
        };

        // Soft relevance: rank keyword matches higher, but never drop valid results.
        let relevance = 0;
        if (kw && keyword.length > 4) {
          const nameLc = name.toLowerCase();
          if (nameLc === kw) relevance = 3;
          else if (nameLc.startsWith(kw)) relevance = 2;
          else if (nameLc.includes(kw)) relevance = 1;
        }

        scored.push({ result, relevance });
      }

      // Best matches first; ties keep Overpass's order.
      scored.sort((a, b) => b.relevance - a.relevance);

      for (const { result } of scored) {
        results.push(result);
        if (results.length >= params.quantity) break;
      }

      return results;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Não foi possível consultar esta fonte de dados.", 502, "PROVIDER_ERROR");
    }
  }
}

export class BrasilEnrichmentProvider implements CompanyEnrichmentProvider {
  readonly key = "brasilapi";
  readonly name = "OpenStreetMap Enrichment (Gratuito)";

  async enrich(_params: CompanyEnrichmentParams): Promise<CompanyEnrichmentResult> {
    throw new AppError(
      "Enriquecimento não disponível ainda com providers gratuitos. Configure COMPANY_PROVIDER_API_KEY para usar um provider pago.",
      501,
      "ENRICHMENT_NOT_AVAILABLE",
    );
  }
}

function normalizeOsmPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return undefined;
  if (digits.length === 9) {
    return `(${digits.slice(0, 2)}) 9${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function buildOsmAddress(tags: Record<string, string>): string | undefined {
  const parts = [tags["addr:street"], tags["addr:housenumber"], tags["addr:full"]];
  const joined = parts.filter(Boolean).join(", ");
  return joined || undefined;
}
