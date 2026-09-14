import { prisma } from "@/shared/database/prisma";
import { AppError, NotFoundError } from "@/shared/errors/AppError";
import { decryptSecret, encryptSecret } from "@/shared/utils/crypto";
import { sendEmail } from "@/shared/utils/email";
import { logAudit } from "@/shared/utils/audit";
import {
  CreateSmtpCredentialInput,
  ListSmtpCredentialsQuery,
  TestSmtpInput,
  UpdateSmtpCredentialInput,
} from "./smtp-credentials.schema";

/** Remove todos os espaços (senhas de app do Google vêm com espaços: "abcd efgh ..."). */
export function normalizeSmtpPassword(password: string): string {
  return password.replace(/\s+/g, "");
}

const publicSelect = {
  id: true,
  workspaceId: true,
  createdById: true,
  name: true,
  host: true,
  port: true,
  username: true,
  fromAddress: true,
  dailyLimit: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createSmtpCredential(
  workspaceId: string,
  userId: string,
  data: CreateSmtpCredentialInput,
) {
  if (data.isDefault) {
    await prisma.smtpCredential.updateMany({
      where: { workspaceId },
      data: { isDefault: false },
    });
  }

  const credential = await prisma.smtpCredential.create({
    data: {
      workspaceId,
      createdById: userId,
      name: data.name.trim(),
      host: data.host.trim(),
      port: data.port,
      username: data.username.trim(),
      passwordEnc: encryptSecret(normalizeSmtpPassword(data.password)),
      fromAddress: data.fromAddress.trim(),
      dailyLimit: data.dailyLimit,
      isDefault: data.isDefault ?? false,
    },
    select: publicSelect,
  });

  await logAudit({
    userId,
    workspaceId,
    action: "smtp_credential.create",
    resourceId: credential.id,
    metadata: { name: credential.name, host: credential.host },
  });

  return { credential };
}

export async function listSmtpCredentials(workspaceId: string, query: ListSmtpCredentialsQuery) {
  const total = await prisma.smtpCredential.count({ where: { workspaceId } });
  const items = await prisma.smtpCredential.findMany({
    where: { workspaceId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    select: publicSelect,
  });

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function updateSmtpCredential(
  workspaceId: string,
  userId: string,
  credentialId: string,
  data: UpdateSmtpCredentialInput,
) {
  const existing = await prisma.smtpCredential.findFirst({
    where: { id: credentialId, workspaceId },
  });
  if (!existing) throw new NotFoundError("Credencial SMTP");

  if (data.isDefault) {
    await prisma.smtpCredential.updateMany({
      where: { workspaceId, id: { not: credentialId } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.smtpCredential.update({
    where: { id: credentialId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.host !== undefined ? { host: data.host.trim() } : {}),
      ...(data.port !== undefined ? { port: data.port } : {}),
      ...(data.username !== undefined ? { username: data.username.trim() } : {}),
      ...(data.password !== undefined
        ? { passwordEnc: encryptSecret(normalizeSmtpPassword(data.password)) }
        : {}),
      ...(data.fromAddress !== undefined ? { fromAddress: data.fromAddress.trim() } : {}),
      ...(data.dailyLimit !== undefined ? { dailyLimit: data.dailyLimit } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    },
    select: publicSelect,
  });

  await logAudit({
    userId,
    workspaceId,
    action: "smtp_credential.update",
    resourceId: credentialId,
  });

  return { credential: updated };
}

export async function deleteSmtpCredential(workspaceId: string, userId: string, credentialId: string) {
  const existing = await prisma.smtpCredential.findFirst({
    where: { id: credentialId, workspaceId },
  });
  if (!existing) throw new NotFoundError("Credencial SMTP");

  await prisma.smtpCredential.delete({ where: { id: credentialId } });

  await logAudit({
    userId,
    workspaceId,
    action: "smtp_credential.delete",
    resourceId: credentialId,
  });

  return { success: true };
}

export async function testSmtpConnection(
  workspaceId: string,
  userId: string,
  data: TestSmtpInput,
  credentialId?: string,
) {
  let host = data.host?.trim() || "smtp.gmail.com";
  let port = data.port || 587;
  let username = data.username.trim();
  let password = normalizeSmtpPassword(data.password);
  let from = data.fromAddress?.trim() || username;

  if (credentialId) {
    const credential = await prisma.smtpCredential.findFirst({
      where: { id: credentialId, workspaceId },
    });
    if (!credential) throw new NotFoundError("Credencial SMTP");
    host = credential.host;
    port = credential.port;
    username = credential.username;
    password = decryptSecret(credential.passwordEnc);
    from = credential.fromAddress;
  }

  const result = await sendEmail({
    to: username,
    subject: "Teste de conexão SMTP — Lead Integra",
    html: "<p>Se você recebeu este e-mail, sua credencial SMTP está funcionando corretamente.</p>",
    from,
    transport: { host, port, user: username, pass: password },
  });

  if (!result.success) {
    throw new AppError(`Falha no teste SMTP: ${result.error || "erro desconhecido"}`, 400);
  }

  await logAudit({
    userId,
    workspaceId,
    action: "smtp_credential.test",
    resourceId: credentialId,
    metadata: { host, username, mocked: result.mocked ?? false },
  });

  return {
    success: true,
    mocked: result.mocked ?? false,
    message: result.mocked
      ? "SMTP do sistema não configurado: envio simulado."
      : `E-mail de teste enviado para ${username}. Verifique a caixa de entrada.`,
  };
}

/** Internal: resolve the SMTP transport config for a workspace (credential or system default). */
export async function resolveSmtpConfig(
  workspaceId: string,
  credentialId?: string | null,
): Promise<{ host: string; port: number; user: string; pass: string; from: string; dailyLimit: number; label: string }> {
  const { env } = await import("@/config/env");

  let credential = null;
  if (credentialId) {
    credential = await prisma.smtpCredential.findFirst({
      where: { id: credentialId, workspaceId },
    });
    if (!credential) throw new NotFoundError("Credencial SMTP");
  } else {
    credential = await prisma.smtpCredential.findFirst({
      where: { workspaceId, isDefault: true },
    });
  }

  if (credential) {
    return {
      host: credential.host,
      port: credential.port,
      user: credential.username,
      pass: decryptSecret(credential.passwordEnc),
      from: credential.fromAddress,
      dailyLimit: credential.dailyLimit,
      label: credential.name,
    };
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
    dailyLimit: env.DEFAULT_EMAIL_DAILY_LIMIT,
    label: "Padrão do sistema",
  };
}

/** Internal: workspace daily limit (credential default or system default). */
export async function getWorkspaceDailyLimit(workspaceId: string): Promise<number> {
  const { env } = await import("@/config/env");
  const credential = await prisma.smtpCredential.findFirst({
    where: { workspaceId, isDefault: true },
    select: { dailyLimit: true },
  });
  return credential?.dailyLimit ?? env.DEFAULT_EMAIL_DAILY_LIMIT;
}
