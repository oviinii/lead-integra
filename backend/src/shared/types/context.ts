import { FastifyRequest } from "fastify";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors/AppError";
import { WorkspaceRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
}

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
    workspace?: WorkspaceContext;
  }
}

export async function getAuthUser(request: FastifyRequest): Promise<AuthUser> {
  if (!request.authUser) {
    throw new UnauthorizedError("Authentication required");
  }
  return request.authUser;
}

export async function getWorkspace(request: FastifyRequest): Promise<WorkspaceContext> {
  if (!request.workspace) {
    throw new ForbiddenError("Workspace context missing");
  }
  return request.workspace;
}

export function requireRole(
  actual: WorkspaceRole,
  required: WorkspaceRole[],
): void {
  if (!required.includes(actual)) {
    throw new ForbiddenError("Insufficient role");
  }
}

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function hasAtLeastRole(actual: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}
