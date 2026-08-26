import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/shared/database/prisma";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors/AppError";
import { hasAtLeastRole, WorkspaceContext } from "@/shared/types/context";
import { WorkspaceRole } from "@prisma/client";

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
    const payload = request.user as { sub: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }
    request.authUser = {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function workspaceResolver(opts: { requiredRole?: WorkspaceRole } = {}) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) throw new UnauthorizedError();
    const headerWs = request.headers["x-workspace-id"];
    const workspaceId = typeof headerWs === "string" ? headerWs : undefined;
    if (!workspaceId) throw new ForbiddenError("Workspace header missing");

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: request.authUser.id } },
    });
    if (!member) throw new ForbiddenError("Not a member of this workspace");
    if (opts.requiredRole && !hasAtLeastRole(member.role, opts.requiredRole)) {
      throw new ForbiddenError("Insufficient role");
    }

    const context: WorkspaceContext = {
      userId: request.authUser.id,
      workspaceId,
      role: member.role,
    };
    request.workspace = context;
  };
}

export async function superAdminOnly(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.authUser?.isSuperAdmin) throw new ForbiddenError("Super admin required");
}
