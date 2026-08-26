import { prisma } from "@/shared/database/prisma";

export interface AuditInput {
  userId?: string;
  workspaceId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: input.metadata as any,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    // Never let audit failure break request flow
    console.error("audit log failed", err);
  }
}
