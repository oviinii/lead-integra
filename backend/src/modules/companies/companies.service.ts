import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/AppError";
import { scoreCompany } from "@/shared/utils/score";
import { ListCompaniesQuery, UpdateCompanyInput } from "./companies.schema";
import { ListCompaniesResult } from "./companies.types";

export async function listCompanies(
  workspaceId: string,
  query: ListCompaniesQuery,
): Promise<ListCompaniesResult> {
  const where: Prisma.CompanyWhereInput = { workspaceId };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { legalName: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.city) where.city = { equals: query.city, mode: "insensitive" };
  if (query.state) where.state = { equals: query.state, mode: "insensitive" };
  if (query.category) where.category = { equals: query.category, mode: "insensitive" };
  if (query.hasPhone) where.phone = { not: null };
  if (query.hasWhatsapp) where.whatsapp = { not: null };
  if (query.hasEmail) where.email = { not: null };
  if (query.hasWebsite) where.website = { not: null };

  const total = await prisma.company.count({ where });

  const orderBy: Prisma.CompanyOrderByWithRelationInput =
    query.sortBy === "score"
      ? { rating: query.sortDir }
      : { [query.sortBy]: query.sortDir };

  const companies = await prisma.company.findMany({
    where,
    orderBy,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const items = companies.map((c) => {
    const score = scoreCompany(c);
    return {
      ...c,
      score: score.score,
      scoreLabel: score.label,
    };
  });

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getCompany(request: FastifyRequest<{ Params: { id: string } }>) {
  const company = await prisma.company.findFirst({
    where: { id: request.params.id, workspaceId: request.workspace!.workspaceId },
    include: { dataSources: true },
  });
  if (!company) throw new NotFoundError("Company");
  const score = scoreCompany(company);
  return { company: { ...company, score: score.score, scoreLabel: score.label } };
}

export async function lookupCompanyCnpj(request: FastifyRequest<{ Params: { id: string } }>) {
  const company = await prisma.company.findFirst({
    where: { id: request.params.id, workspaceId: request.workspace!.workspaceId },
  });
  if (!company) throw new NotFoundError("Company");

  if (company.document) {
    return { found: true, document: company.document, source: "stored" };
  }

  return {
    found: false,
    searchUrl: "https://www.receitaws.com.br/",
  };
}

export async function updateCompany(
  workspaceId: string,
  companyId: string,
  body: UpdateCompanyInput,
): Promise<{ company: any }> {
  const company = await prisma.company.findFirst({ where: { id: companyId, workspaceId } });
  if (!company) throw new NotFoundError("Company");

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: body,
  });

  return { company: updated };
}

function normalizeCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}
