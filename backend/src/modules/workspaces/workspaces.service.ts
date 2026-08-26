import { randomBytes } from "node:crypto";
import { FastifyInstance, FastifyRequest } from "fastify";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/shared/database/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "@/shared/errors/AppError";
import { logAudit } from "@/shared/utils/audit";

export async function listWorkspaces(request: FastifyRequest) {
  if (!request.authUser) throw new ForbiddenError();
  const members = await prisma.workspaceMember.findMany({
    where: { userId: request.authUser.id },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          logoUrl: true,
          ownerId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return {
    workspaces: members.map((m) => ({
      ...m.workspace,
      role: m.role,
    })),
  };
}

export async function createWorkspace(
  app: FastifyInstance,
  request: FastifyRequest<{ Body: { name: string } }>,
) {
  if (!request.authUser) throw new ForbiddenError();
  const { name } = request.body;
  const slug =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) + "-" + randomBytes(2).toString("hex");

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      ownerId: request.authUser.id,
      members: { create: { userId: request.authUser.id, role: "OWNER" } },
      creditBalance: { create: { balance: 100, lifetime: 100 } },
      creditTransactions: {
        create: { type: "BONUS", amount: 100, description: "Bônus nova workspace" },
      },
    },
  });
  await logAudit({
    userId: request.authUser.id,
    workspaceId: workspace.id,
    action: "workspace.create",
    resourceId: workspace.id,
  });
  return { workspace };
}

export async function getWorkspace(request: FastifyRequest<{ Params: { id: string } }>) {
  const { id } = request.params;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: request.authUser!.id } },
    include: {
      workspace: {
        include: {
          creditBalance: true,
          _count: { select: { members: true, companies: true, leads: true } },
        },
      },
    },
  });
  if (!member) throw new ForbiddenError();
  return { workspace: member.workspace, role: member.role };
}

export async function updateWorkspace(
  request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; logoUrl?: string | null } }>,
) {
  const { id } = request.params;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: request.authUser!.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    throw new ForbiddenError();
  }
  const workspace = await prisma.workspace.update({
    where: { id },
    data: { ...request.body },
  });
  await logAudit({
    userId: request.authUser!.id,
    workspaceId: id,
    action: "workspace.update",
    resourceId: id,
  });
  return { workspace };
}

export async function listMembers(request: FastifyRequest<{ Params: { id: string } }>) {
  const { id } = request.params;
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: id, workspace: { members: { some: { userId: request.authUser!.id } } } },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return { members };
}

export async function inviteMember(
  request: FastifyRequest<{ Params: { id: string }; Body: { email: string; role: WorkspaceRole } }>,
) {
  const { id } = request.params;
  const { email, role } = request.body;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: request.authUser!.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    throw new ForbiddenError();
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError("User with this email");
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: user.id } },
  });
  if (existing) throw new ConflictError("User already a member");
  const created = await prisma.workspaceMember.create({
    data: { workspaceId: id, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await logAudit({
    userId: request.authUser!.id,
    workspaceId: id,
    action: "workspace.invite",
    metadata: { invitedUserId: user.id, role },
  });
  return { member: created };
}

export async function updateMember(
  request: FastifyRequest<{ Params: { id: string; memberId: string }; Body: { role: WorkspaceRole } }>,
) {
  const { id, memberId } = request.params;
  const me = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: request.authUser!.id } },
  });
  if (!me || me.role !== "OWNER") throw new ForbiddenError("Only owners can change roles");
  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: request.body.role },
  });
  await logAudit({
    userId: request.authUser!.id,
    workspaceId: id,
    action: "workspace.member.update",
    resourceId: memberId,
    metadata: { newRole: request.body.role },
  });
  return { member: updated };
}

export async function removeMember(
  request: FastifyRequest<{ Params: { id: string; memberId: string } }>,
) {
  const { id, memberId } = request.params;
  const me = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: request.authUser!.id } },
  });
  if (!me || (me.role !== "OWNER" && me.role !== "ADMIN")) throw new ForbiddenError();
  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target || target.workspaceId !== id) throw new NotFoundError("Member");
  if (target.role === "OWNER") throw new ForbiddenError("Cannot remove owner");
  await prisma.workspaceMember.delete({ where: { id: memberId } });
  await logAudit({
    userId: request.authUser!.id,
    workspaceId: id,
    action: "workspace.member.remove",
    resourceId: memberId,
  });
  return { success: true };
}
