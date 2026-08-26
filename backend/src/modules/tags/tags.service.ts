import { FastifyRequest } from "fastify";
import { prisma } from "@/shared/database/prisma";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";
import { CreateTagInput } from "./tags.schema";

export async function listTags(workspaceId: string) {
  const tags = await prisma.tag.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
  return { tags };
}

export async function createTag(workspaceId: string, body: CreateTagInput) {
  const existing = await prisma.tag.findUnique({
    where: { workspaceId_name: { workspaceId, name: body.name } },
  });
  if (existing) throw new ConflictError("Tag already exists");
  const tag = await prisma.tag.create({
    data: { workspaceId, name: body.name, color: body.color },
  });
  return { tag };
}

export async function deleteTag(workspaceId: string, tagId: string) {
  const tag = await prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
  if (!tag) throw new NotFoundError("Tag");
  await prisma.tag.delete({ where: { id: tagId } });
  return { success: true };
}

export async function addTagToLead(workspaceId: string, leadId: string, tagId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) throw new NotFoundError("Lead");
  const tag = await prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
  if (!tag) throw new NotFoundError("Tag");
  await prisma.leadTag.upsert({
    where: { leadId_tagId: { leadId, tagId } },
    create: { leadId, tagId },
    update: {},
  });
  return { success: true };
}

export async function removeTagFromLead(workspaceId: string, leadId: string, tagId: string) {
  await prisma.leadTag.deleteMany({ where: { leadId, tagId, lead: { workspaceId } } });
  return { success: true };
}
