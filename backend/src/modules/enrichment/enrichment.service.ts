import { prisma } from "@/shared/database/prisma";
import { NotFoundError, InsufficientCreditsError, AppError } from "@/shared/errors/AppError";
import { providerRegistry } from "@/modules/providers/providerFactory";
import { CompanyEnrichmentParams, CompanyEnrichmentResult } from "@/modules/providers/interfaces";
import { logAudit } from "@/shared/utils/audit";
import { Lead } from "@prisma/client";

const ENRICHMENT_COST_PER_FIELD = 1;

async function deductCredits(workspaceId: string, userId: string, amount: number, description: string, reference?: string): Promise<void> {
  const balance = await prisma.creditBalance.findUnique({ where: { workspaceId } });
  if (!balance || balance.balance < amount) throw new InsufficientCreditsError();

  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { workspaceId },
      data: { balance: { decrement: amount } },
    }),
    prisma.creditTransaction.create({
      data: { workspaceId, type: "ENRICHMENT", amount: -amount, description, reference },
    }),
  ]);
}

export async function enrichCompany(
  workspaceId: string,
  userId: string,
  companyId: string,
  providerKey?: string,
  fields?: CompanyEnrichmentParams["fields"],
): Promise<{ company: any; result: CompanyEnrichmentResult }> {
  const company = await prisma.company.findFirst({
    where: { id: companyId, workspaceId },
  });
  if (!company) throw new NotFoundError("Company");

  const provider = providerKey ? providerRegistry.getEnrichmentProvider(providerKey) : providerRegistry.enrichmentProviders()[0];
  if (!provider) throw new AppError("Nenhum provider de enriquecimento disponível.", 501, "NO_ENRICHMENT_PROVIDER");

  const requestedFields = fields ?? ["email", "phone", "whatsapp", "website", "social"];
  const cost = requestedFields.length * ENRICHMENT_COST_PER_FIELD;
  await deductCredits(workspaceId, userId, cost, `Enriquecimento: ${provider.name}`, companyId);

  const params: CompanyEnrichmentParams = {
    company: {
      name: company.name,
      website: company.website,
      phone: company.phone,
      email: company.email,
      city: company.city,
      state: company.state,
      country: company.country,
      document: company.document,
      raw: company.raw,
    },
    fields: requestedFields,
  };

  const result = await provider.enrich(params);

  const updates: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(result.fields)) {
    if (value?.value) {
      const fieldMap: Record<string, string> = {
        email: "email",
        phone: "phone",
        whatsapp: "whatsapp",
        website: "website",
      };
      const dbField = fieldMap[key];
      if (dbField) (updates as Record<string, string | null>)[dbField] = value.value;
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: updates,
  });

  await prisma.enrichmentJob.create({
    data: {
      workspaceId,
      companyId,
      type: provider.key,
      status: "COMPLETED",
      result: result as any,
      creditsUsed: cost,
      completedAt: new Date(),
    },
  });

  await logAudit({
    userId,
    workspaceId,
    action: "company.enrich",
    resourceId: companyId,
    metadata: { provider: provider.key, fields: requestedFields },
  });

  return { company: { ...company, ...updates }, result };
}

export async function batchEnrichLeads(
  workspaceId: string,
  userId: string,
  leadIds: string[],
  providerKey?: string,
  fields?: CompanyEnrichmentParams["fields"],
): Promise<{ enriched: number; failed: number; errors: string[] }> {
  const provider = providerKey ? providerRegistry.getEnrichmentProvider(providerKey) : providerRegistry.enrichmentProviders()[0];
  if (!provider) throw new AppError("Nenhum provider de enriquecimento disponível.", 501, "NO_ENRICHMENT_PROVIDER");

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, workspaceId },
    include: { company: true },
  });

  const requestedFields = fields ?? ["email", "phone", "whatsapp", "website", "social"];
  const costPerLead = requestedFields.length * ENRICHMENT_COST_PER_FIELD;

  await deductCredits(workspaceId, userId, leads.length * costPerLead, `Enriquecimento em lote (${leads.length} leads)`, leads[0]?.id);

  let enriched = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      const params: CompanyEnrichmentParams = {
        company: {
          name: lead.company.name,
          website: lead.company.website,
          phone: lead.company.phone,
          email: lead.company.email,
          city: lead.company.city,
          state: lead.company.state,
          country: lead.company.country,
        },
        fields: requestedFields,
      };

      const result = await provider.enrich(params);

      const updates: Record<string, string | null> = {};
      for (const [key, value] of Object.entries(result.fields)) {
        if (value?.value) {
          const fieldMap: Record<string, string> = { email: "email", phone: "phone", whatsapp: "whatsapp", website: "website" };
          const dbField = fieldMap[key];
          if (dbField) (updates as Record<string, string | null>)[dbField] = value.value;
        }
      }

      await prisma.company.update({
        where: { id: lead.companyId },
        data: updates,
      });

      await prisma.enrichmentJob.create({
        data: {
          workspaceId,
          companyId: lead.companyId,
          type: provider.key,
          status: "COMPLETED",
          result: result as any,
          creditsUsed: costPerLead,
          completedAt: new Date(),
        },
      });

      enriched++;
    } catch (err: any) {
      failed++;
      errors.push(`${lead.id}: ${err.message || "Erro desconhecido"}`);
    }
  }

  await logAudit({
    userId,
    workspaceId,
    action: "enrichment.batch",
    resourceId: `${leadIds[0]}`,
    metadata: { provider: provider.key, total: leadIds.length, enriched, failed },
  });

  return { enriched, failed, errors };
}

export async function listEnrichmentJobs(workspaceId: string): Promise<{ jobs: any[] }> {
  const jobs = await prisma.enrichmentJob.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const companyIds = [...new Set(jobs.map((j) => j.companyId))];
  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, name: true },
  });
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const enriched = jobs.map((j) => ({
    ...j,
    company: companyMap.get(j.companyId) ?? null,
  }));

  return { jobs: enriched };
}

export async function getEnrichedCompanyIds(workspaceId: string): Promise<{ companyIds: string[] }> {
  const jobs = await prisma.enrichmentJob.findMany({
    where: { workspaceId, status: "COMPLETED" },
    select: { companyId: true },
  });
  return { companyIds: [...new Set(jobs.map((j) => j.companyId))] };
}

export async function getEnrichmentProviders(): Promise<{ providers: Array<{ key: string; name: string }> }> {
  const providers = providerRegistry.enrichmentProviders().map((p) => ({ key: p.key, name: p.name }));
  return { providers };
}
