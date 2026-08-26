import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/database/prisma";
import { AppError, InsufficientCreditsError, NotFoundError } from "@/shared/errors/AppError";
import { providerRegistry } from "@/modules/providers/providerFactory";
import type { CompanySearchResult } from "@/modules/providers/interfaces";
import { scoreCompany } from "@/shared/utils/score";
import { normalizeDomain, normalizeEmail, normalizePhone } from "@/shared/utils/normalize";
import { CreateSearchInput, ListSearchQuery } from "./search.schema";
import { logAudit } from "@/shared/utils/audit";

const SEARCH_COST_PER_COMPANY = 1;

export async function createSearch(
  request: FastifyRequest<{ Body: CreateSearchInput }>,
) {
  if (!request.authUser || !request.workspace) throw new AppError("Unauthorized", 401);
  const { workspaceId, userId } = request.workspace;
  const params = request.body;

  const balance = await prisma.creditBalance.findUnique({ where: { workspaceId } });
  const cost = params.quantity * SEARCH_COST_PER_COMPANY;
  if (!balance || balance.balance < cost) throw new InsufficientCreditsError();

  const search = await prisma.search.create({
    data: {
      workspaceId,
      userId,
      keyword: params.keyword,
      country: params.country,
      state: params.state,
      region: params.region,
      city: params.city,
      neighborhood: params.neighborhood,
      postalCode: params.postalCode,
      radiusKm: params.radiusKm,
      category: params.category,
      quantity: params.quantity,
      filters: (params.filters ?? {}) as Prisma.InputJsonValue,
      status: "PROCESSING",
    },
  });

  await deductCredits(workspaceId, cost, "Pesquisa criada", search.id);

  // Execute provider synchronously for MVP. Migrate to BullMQ in Phase 2.
  try {
    const providers = providerRegistry.searchProviders();
    const provider = providers[0];
    if (!provider) throw new AppError("No search provider configured", 500, "NO_PROVIDER");

    const results = await provider.search({
      keyword: params.keyword,
      country: params.country,
      state: params.state,
      region: params.region,
      city: params.city,
      neighborhood: params.neighborhood,
      postalCode: params.postalCode,
      radiusKm: params.radiusKm,
      category: params.category,
      quantity: params.quantity,
    });

    const created = await persistResults(workspaceId, search.id, results);
    const updated = await prisma.search.update({
      where: { id: search.id },
      data: {
        status: "COMPLETED",
        resultsCount: created.resultsCount,
        savedCount: created.savedCount,
        completedAt: new Date(),
      },
    });

    await logAudit({
      userId,
      workspaceId,
      action: "search.complete",
      resourceId: search.id,
      metadata: { resultsCount: created.resultsCount },
    });

    return { search: updated, resultsCount: created.resultsCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    await prisma.search.update({
      where: { id: search.id },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
    });
    await refundCredits(workspaceId, cost, "Falha na pesquisa - estorno", search.id);
    throw err;
  }
}

async function persistResults(
  workspaceId: string,
  searchId: string,
  results: CompanySearchResult[],
): Promise<{ resultsCount: number; savedCount: number }> {
  let savedCount = 0;
  for (const r of results) {
    if (!r.name) continue;
    const phoneNormalized = normalizePhone(r.phone);
    const emailNormalized = normalizeEmail(r.email);
    const domain = normalizeDomain(r.website);
    const score = scoreCompany({
      phone: r.phone ?? null,
      whatsapp: r.whatsapp ?? null,
      email: r.email ?? null,
      website: r.website ?? null,
      instagram: r.instagram ?? null,
      facebook: r.facebook ?? null,
      rating: r.rating ?? null,
      reviewCount: r.reviewCount ?? null,
      isActive: r.isActive ?? true,
    });

    // Dedup key: externalId+source, else document, else domain, else phone, else name+city
    const dedupWhere: Prisma.CompanyWhereInput[] = [];
    if (r.externalId && r.source) {
      dedupWhere.push({
        workspaceId,
        externalId: r.externalId,
        source: r.source,
      });
    }
    if (r.document) dedupWhere.push({ workspaceId, document: r.document });
    if (domain) dedupWhere.push({ workspaceId, website: { contains: domain } });
    if (phoneNormalized) dedupWhere.push({ workspaceId, phone: { contains: phoneNormalized } });

    const existing = dedupWhere.length
      ? await prisma.company.findFirst({ where: { OR: dedupWhere } })
      : null;

    let company;
    if (existing) {
      company = await prisma.company.update({
        where: { id: existing.id },
        data: {
          name: existing.name || r.name,
          phone: existing.phone || r.phone,
          whatsapp: existing.whatsapp || r.whatsapp,
          email: existing.email || r.email,
          website: existing.website || r.website,
          instagram: existing.instagram || r.instagram,
          facebook: existing.facebook || r.facebook,
          rating: r.rating ?? existing.rating,
          reviewCount: r.reviewCount ?? existing.reviewCount,
          updatedAt: new Date(),
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          workspaceId,
          externalId: r.externalId,
          source: r.source,
          sourceUrl: r.sourceUrl,
          name: r.name,
          legalName: r.legalName,
          document: r.document,
          category: r.category,
          description: r.description,
          phone: r.phone,
          whatsapp: r.whatsapp,
          email: r.email,
          website: r.website,
          instagram: r.instagram,
          facebook: r.facebook,
          linkedin: r.linkedin,
          address: r.address,
          neighborhood: r.neighborhood,
          city: r.city,
          state: r.state,
          country: r.country,
          postalCode: r.postalCode,
          latitude: r.latitude,
          longitude: r.longitude,
          rating: r.rating,
          reviewCount: r.reviewCount,
          isActive: r.isActive ?? true,
          businessHours: r.businessHours as Prisma.InputJsonValue,
          raw: r.raw as Prisma.InputJsonValue,
        },
      });
      savedCount++;
    }

    await prisma.searchResult.upsert({
      where: { searchId_companyId: { searchId, companyId: company.id } },
      create: { searchId, companyId: company.id, rank: score.score },
      update: {},
    });
  }

  const total = await prisma.searchResult.count({ where: { searchId } });
  return { resultsCount: total, savedCount };
}

export async function listSearches(
  workspaceId: string,
  query: ListSearchQuery,
) {
  const where: Prisma.SearchWhereInput = { workspaceId };
  if (query.status) where.status = query.status;
  const total = await prisma.search.count({ where });
  const items = await prisma.search.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function getSearch(
  workspaceId: string,
  searchId: string,
) {
  const search = await prisma.search.findFirst({
    where: { id: searchId, workspaceId },
    include: {
      results: {
        include: { company: true },
        orderBy: { rank: "desc" },
      },
    },
  });
  if (!search) throw new NotFoundError("Search");
  return { search };
}

export async function cancelSearch(
  workspaceId: string,
  searchId: string,
) {
  const search = await prisma.search.findFirst({ where: { id: searchId, workspaceId } });
  if (!search) throw new NotFoundError("Search");
  if (search.status === "COMPLETED" || search.status === "FAILED" || search.status === "CANCELLED") {
    return { search };
  }
  const updated = await prisma.search.update({
    where: { id: searchId },
    data: { status: "CANCELLED", completedAt: new Date() },
  });
  return { search: updated };
}

async function deductCredits(
  workspaceId: string,
  amount: number,
  description: string,
  reference?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { workspaceId },
      data: { balance: { decrement: amount }, lifetime: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: { workspaceId, type: "SEARCH", amount: -amount, description, reference },
    }),
  ]);
}

async function refundCredits(
  workspaceId: string,
  amount: number,
  description: string,
  reference?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { workspaceId },
      data: { balance: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: { workspaceId, type: "REFUND", amount, description, reference },
    }),
  ]);
}
