import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config/env";
import { prisma } from "@/shared/database/prisma";
import { ConflictError, UnauthorizedError, NotFoundError, AppError } from "@/shared/errors/AppError";
import { LoginInput, RegisterInput, RefreshInput } from "./auth.schema";
import { logAudit } from "@/shared/utils/audit";
import { isMaintenanceMode } from "@/shared/utils/platformSettings";

const REFRESH_BYTES = 48;

async function hashToken(token: string): Promise<string> {
  return createHash("sha256").update(token).digest("hex");
}

async function signTokens(app: FastifyInstance, userId: string, email: string) {
  const accessToken = await app.jwt.sign(
    { sub: userId, email },
    { expiresIn: env.JWT_EXPIRES_IN },
  );
  const refreshToken = randomBytes(REFRESH_BYTES).toString("hex");
  const tokenHash = await hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return { accessToken, refreshToken };
}

export async function registerHandler(
  app: FastifyInstance,
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  const { name, email, password, workspaceName } = request.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const slug = workspaceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) + "-" + randomBytes(2).toString("hex");

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, passwordHash },
    });
    await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
        ownerId: u.id,
        members: { create: { userId: u.id, role: "OWNER" } },
        creditBalance: { create: { balance: env.PLANS.FREE, lifetime: env.PLANS.FREE } },
        creditTransactions: {
          create: {
            type: "BONUS",
            amount: env.PLANS.FREE,
            description: "Bônus inicial - Plano FREE",
          },
        },
      },
    });
    return u;
  });

  const tokens = await signTokens(app, user.id, user.email);
  await logAudit({ userId: user.id, action: "auth.register" });
  reply.code(201);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    ...tokens,
  };
}

export async function loginHandler(
  app: FastifyInstance,
  request: FastifyRequest<{ Body: LoginInput }>,
) {
  const { email, password } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new UnauthorizedError("Invalid credentials");
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw new UnauthorizedError("Invalid credentials");

  if (!user.isSuperAdmin && (await isMaintenanceMode())) {
    throw new AppError("Plataforma em manutenção. Tente novamente em instantes.", 503, "MAINTENANCE_MODE");
  }

  const tokens = await signTokens(app, user.id, user.email);
  await logAudit({ userId: user.id, action: "auth.login", ip: request.ip, userAgent: request.headers["user-agent"] as string });
  return {
    user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
    ...tokens,
  };
}

export async function refreshHandler(
  app: FastifyInstance,
  request: FastifyRequest<{ Body: RefreshInput }>,
) {
  const { refreshToken } = request.body;
  const tokenHash = await hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) throw new UnauthorizedError();

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await signTokens(app, user.id, user.email);
  return tokens;
}

export async function logoutHandler(request: FastifyRequest<{ Body: { refreshToken?: string } }>) {
  if (request.body?.refreshToken) {
    const tokenHash = await hashToken(request.body.refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  if (request.authUser) {
    await logAudit({ userId: request.authUser.id, action: "auth.logout" });
  }
  return { success: true };
}

export async function meHandler(request: FastifyRequest) {
  if (!request.authUser) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({
    where: { id: request.authUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
      avatarUrl: true,
      createdAt: true,
      workspaceMembers: {
        select: {
          workspace: { select: { id: true, name: true, slug: true, plan: true } },
          role: true,
        },
      },
    },
  });
  if (!user) throw new NotFoundError("User");
  return { user };
}

export async function forgotPasswordHandler(request: FastifyRequest<{ Body: { email: string } }>) {
  const { email } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = await hashToken(token);
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    // In production, send via SMTP. For MVP we log.
    request.log.info({ resetToken: token, email }, "Password reset token");
  }
  // Always return success to avoid enumeration
  return { success: true, message: "If the email exists, a reset link was sent." };
}

export async function resetPasswordHandler(request: FastifyRequest<{ Body: { token: string; password: string } }>) {
  const { token, password } = request.body;
  const tokenHash = await hashToken(token);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  return { success: true };
}

export async function changePasswordHandler(request: FastifyRequest<{ Body: { currentPassword: string; newPassword: string } }>) {
  if (!request.authUser) throw new UnauthorizedError();
  const { currentPassword, newPassword } = request.body;
  const user = await prisma.user.findUnique({ where: { id: request.authUser.id } });
  if (!user) throw new UnauthorizedError();
  const valid = await argon2.verify(user.passwordHash, currentPassword);
  if (!valid) throw new AppError("Current password invalid", 400, "INVALID_PASSWORD");
  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { success: true };
}
