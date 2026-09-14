import { FastifyRequest } from "fastify";
import { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/database/prisma";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";
import { scoreCompany } from "@/shared/utils/score";
import { logAudit } from "@/shared/utils/audit";
import { CreateLeadInput, ListLeadsQuery, UpdateLeadInput } from "./leads.schema";

export async function createLead(
  workspaceId: string,
  userId: string,
  body: CreateLeadInput,
) {
  let companyId = body.companyId;

  if (!companyId && body.company) {
    const manual = body.company;
    const emailNormalized = manual.email?.trim().toLowerCase() || null;

    // Reuse existing company in the workspace if document or email matches
    const dedupOr: Prisma.CompanyWhereInput[] = [];
    if (manual.document?.trim()) dedupOr.push({ workspaceId, document: manual.document.trim() });
    if (emailNormalized) dedupOr.push({ workspaceId, email: emailNormalized });

    const duplicate = dedupOr.length
      ? await prisma.company.findFirst({ where: { OR: dedupOr } })
      : null;

    if (duplicate) {
      companyId = duplicate.id;
    } else {
      const created = await prisma.company.create({
        data: {
          workspaceId,
          source: "manual",
          name: manual.name.trim(),
          email: emailNormalized,
          phone: manual.phone?.trim() || null,
          whatsapp: manual.whatsapp?.trim() || null,
          website: manual.website?.trim() || null,
          document: manual.document?.trim() || null,
          category: manual.category?.trim() || null,
          city: manual.city?.trim() || null,
          state: manual.state?.trim() || null,
          address: manual.address?.trim() || null,
          isActive: true,
        },
      });
      companyId = created.id;
    }
  }

  if (!companyId) throw new NotFoundError("Company");

  const company = await prisma.company.findFirst({
    where: { id: companyId, workspaceId },
  });
  if (!company) throw new NotFoundError("Company");

  const existing = await prisma.lead.findUnique({
    where: { workspaceId_companyId: { workspaceId, companyId } },
  });
  if (existing) throw new ConflictError("Company already saved as lead");

  const score = scoreCompany(company);

  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      companyId: companyId as string,
      status: body.status,
      notes: body.notes,
      assigneeId: body.assigneeId,
      createdById: userId,
      score: score.score,
      scoreLabel: score.label,
    },
  });

  if (body.listIds?.length) {
    await prisma.leadListItem.createMany({
      data: body.listIds.map((listId) => ({ listId, leadId: lead.id })),
      skipDuplicates: true,
    });
  }

  if (body.tagIds?.length) {
    await prisma.leadTag.createMany({
      data: body.tagIds.map((tagId) => ({ tagId, leadId: lead.id })),
      skipDuplicates: true,
    });
  }

  await logAudit({
    userId,
    workspaceId,
    action: "lead.create",
    resourceId: lead.id,
    metadata: { companyId },
  });

  return { lead };
}

export async function listLeads(workspaceId: string, query: ListLeadsQuery) {
  const where: Prisma.LeadWhereInput = { workspaceId };
  if (query.status) where.status = query.status;
  if (query.listId) where.lists = { some: { listId: query.listId } };
  if (query.tagId) where.tags = { some: { tagId: query.tagId } };

  if (query.q || query.city || query.state || query.category) {
    where.company = {};
    if (query.q) {
      where.company.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.city) where.company.city = { equals: query.city, mode: "insensitive" };
    if (query.state) where.company.state = { equals: query.state, mode: "insensitive" };
    if (query.category) where.company.category = { equals: query.category, mode: "insensitive" };
  }

  const total = await prisma.lead.count({ where });
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    query.sortBy === "name" ? { company: { name: query.sortDir } } : { [query.sortBy]: query.sortDir };

  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    include: {
      company: true,
      assignee: { select: { id: true, name: true, email: true } },
      lists: { include: { list: { select: { id: true, name: true, color: true } } } },
      tags: { include: { tag: true } },
    },
  });

  return {
    items: leads,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getLead(workspaceId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
    include: {
      company: true,
      assignee: { select: { id: true, name: true, email: true } },
      lists: { include: { list: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!lead) throw new NotFoundError("Lead");
  return { lead };
}

export async function updateLead(
  workspaceId: string,
  userId: string,
  leadId: string,
  body: UpdateLeadInput,
) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) throw new NotFoundError("Lead");

  const data: Prisma.LeadUpdateInput = {};
  if (body.status) {
    data.status = body.status;
    data.lastContactAt = new Date();
  }
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.assigneeId !== undefined) data.assignee = body.assigneeId ? { connect: { id: body.assigneeId } } : { disconnect: true };

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data,
    include: { company: true, tags: { include: { tag: true } } },
  });

  await logAudit({
    userId,
    workspaceId,
    action: "lead.update",
    resourceId: leadId,
    metadata: body,
  });

  return { lead: updated };
}

export async function deleteLead(workspaceId: string, userId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) throw new NotFoundError("Lead");
  await prisma.lead.delete({ where: { id: leadId } });
  await logAudit({
    userId,
    workspaceId,
    action: "lead.delete",
    resourceId: leadId,
  });
  return { success: true };
}

export async function changeLeadStatus(
  workspaceId: string,
  userId: string,
  leadId: string,
  status: LeadStatus,
) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) throw new NotFoundError("Lead");
  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: { status, lastContactAt: new Date() },
  });
  await logAudit({
    userId,
    workspaceId,
    action: "lead.status",
    resourceId: leadId,
    metadata: { status },
  });
  return { lead: updated };
}
