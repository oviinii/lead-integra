import { FastifyRequest } from "fastify";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/AppError";
import { CreateListInput } from "./lists.schema";

export async function listLists(workspaceId: string) {
  const lists = await prisma.leadList.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return { lists };
}

export async function createList(workspaceId: string, body: CreateListInput) {
  const list = await prisma.leadList.create({
    data: { workspaceId, name: body.name, description: body.description, color: body.color },
  });
  return { list };
}

export async function getList(workspaceId: string, id: string) {
  const list = await prisma.leadList.findFirst({
    where: { id, workspaceId },
    include: {
      items: {
        include: {
          lead: { include: { company: true, tags: { include: { tag: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!list) throw new NotFoundError("List");
  return { list };
}

export async function updateList(
  workspaceId: string,
  id: string,
  body: { name?: string; description?: string; color?: string },
) {
  const list = await prisma.leadList.findFirst({ where: { id, workspaceId } });
  if (!list) throw new NotFoundError("List");
  const updated = await prisma.leadList.update({ where: { id }, data: body });
  return { list: updated };
}

export async function deleteList(workspaceId: string, id: string) {
  const list = await prisma.leadList.findFirst({ where: { id, workspaceId } });
  if (!list) throw new NotFoundError("List");
  await prisma.leadList.delete({ where: { id } });
  return { success: true };
}

export async function addLeadsToList(workspaceId: string, listId: string, leadIds: string[]) {
  const list = await prisma.leadList.findFirst({ where: { id: listId, workspaceId } });
  if (!list) throw new NotFoundError("List");
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, workspaceId },
    select: { id: true },
  });
  await prisma.leadListItem.createMany({
    data: leads.map((l) => ({ listId, leadId: l.id })),
    skipDuplicates: true,
  });
  return { added: leads.length };
}

export async function removeLeadFromList(workspaceId: string, listId: string, leadId: string) {
  await prisma.leadListItem.deleteMany({
    where: { leadId, listId, list: { workspaceId } },
  });
  return { success: true };
}
