import { prisma } from "@/shared/database/prisma";
import { AppError, NotFoundError } from "@/shared/errors/AppError";
import { sendEmail, SmtpTransportConfig } from "@/shared/utils/email";
import { logAudit } from "@/shared/utils/audit";
import { getWorkspaceDailyLimit, resolveSmtpConfig } from "@/modules/smtp-credentials/smtp-credentials.service";
import { CreateCampaignInput, ListCampaignsQuery, UpdateCampaignInput } from "./email-campaigns.schema";

/** Início do dia atual no fuso de São Paulo (UTC-3, sem horário de verão desde 2019). */
export function startOfTodaySaoPaulo(now = new Date()): Date {
  const spTime = new Date(now.getTime() - 3 * 3600 * 1000);
  spTime.setUTCHours(0, 0, 0, 0);
  return new Date(spTime.getTime() + 3 * 3600 * 1000);
}

export async function previewRecipients(
  workspaceId: string,
  listId?: string | null,
  tagId?: string | null,
) {
  const recipients = await getEligibleRecipients(workspaceId, listId, tagId);
  return {
    count: recipients.length,
    sample: recipients.slice(0, 5).map((r) => ({ name: r.name, email: r.email })),
  };
}

export async function getEmailQuota(workspaceId: string) {
  const dailyLimit = await getWorkspaceDailyLimit(workspaceId);
  const dayStart = startOfTodaySaoPaulo();
  const sentToday = await prisma.emailLog.count({
    where: {
      status: "SENT",
      createdAt: { gte: dayStart },
      campaign: { workspaceId },
    },
  });
  const remaining = Math.max(0, dailyLimit - sentToday);
  const nextReset = new Date(dayStart.getTime() + 24 * 3600 * 1000);
  return { sentToday, dailyLimit, remaining, resetsAt: nextReset.toISOString() };
}

interface RecipientItem {
  leadId?: string | null;
  email: string;
  name: string;
}

function cleanId(value?: string | null): string | null {
  if (!value || !value.trim()) return null;
  return value;
}

async function getEligibleRecipients(
  workspaceId: string,
  listId?: string | null,
  tagId?: string | null,
): Promise<RecipientItem[]> {
  listId = cleanId(listId);
  tagId = cleanId(tagId);
  if (listId) {
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        lists: { some: { listId } },
        company: { email: { not: null } },
      },
      include: { company: { select: { email: true, name: true } } },
    });
    return leads
      .filter((l) => Boolean(l.company.email && l.company.email.trim().length > 0))
      .map((l) => ({ leadId: l.id, email: l.company.email!.trim(), name: l.company.name }));
  }

  if (tagId) {
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        tags: { some: { tagId } },
        company: { email: { not: null } },
      },
      include: { company: { select: { email: true, name: true } } },
    });
    return leads
      .filter((l) => Boolean(l.company.email && l.company.email.trim().length > 0))
      .map((l) => ({ leadId: l.id, email: l.company.email!.trim(), name: l.company.name }));
  }

  // Fetch ALL companies in the workspace with valid email (from search results or leads)
  const companies = await prisma.company.findMany({
    where: {
      workspaceId,
      email: { not: null },
    },
    include: {
      leads: {
        where: { workspaceId },
        select: { id: true },
      },
    },
  });

  return companies
    .filter((c) => Boolean(c.email && c.email.trim().length > 0))
    .map((c) => ({
      leadId: c.leads[0]?.id || null,
      email: c.email!.trim(),
      name: c.name,
    }));
}

export async function createCampaign(
  workspaceId: string,
  userId: string,
  data: CreateCampaignInput,
) {
  const recipients = await getEligibleRecipients(workspaceId, data.listId, data.tagId);

  const campaign = await prisma.emailCampaign.create({
    data: {
      workspaceId,
      createdById: userId,
      name: data.name,
      subject: data.subject,
      bodyContent: data.bodyContent,
      listId: cleanId(data.listId),
      tagId: cleanId(data.tagId),
      smtpCredentialId: cleanId(data.smtpCredentialId),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      totalRecipients: recipients.length,
    },
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
      smtpCredential: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId,
    workspaceId,
    action: "email_campaign.create",
    resourceId: campaign.id,
    metadata: { name: campaign.name, totalRecipients: recipients.length },
  });

  return { campaign };
}

export async function listCampaigns(workspaceId: string, query: ListCampaignsQuery) {
  const where: any = { workspaceId };
  if (query.status) where.status = query.status;

  const total = await prisma.emailCampaign.count({ where });
  const items = await prisma.emailCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
      smtpCredential: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getCampaign(workspaceId: string, campaignId: string) {
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
      smtpCredential: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true, email: true } },
      logs: {
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { lead: { include: { company: { select: { name: true } } } } },
      },
    },
  });
  if (!campaign) throw new NotFoundError("Campanha de e-mail");
  return { campaign };
}

export async function updateCampaign(
  workspaceId: string,
  userId: string,
  campaignId: string,
  data: UpdateCampaignInput,
) {
  const existing = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, workspaceId },
  });
  if (!existing) throw new NotFoundError("Campanha de e-mail");
  if (existing.status === "SENDING" || existing.status === "COMPLETED") {
    throw new AppError("Não é possível alterar uma campanha em andamento ou concluída", 400);
  }

  const listId = data.listId !== undefined ? cleanId(data.listId) : existing.listId;
  const tagId = data.tagId !== undefined ? cleanId(data.tagId) : existing.tagId;
  const smtpCredentialId =
    data.smtpCredentialId !== undefined ? cleanId(data.smtpCredentialId) : existing.smtpCredentialId;

  const recipients = await getEligibleRecipients(workspaceId, listId, tagId);

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      name: data.name ?? existing.name,
      subject: data.subject ?? existing.subject,
      bodyContent: data.bodyContent ?? existing.bodyContent,
      listId,
      tagId,
      smtpCredentialId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduledAt,
      totalRecipients: recipients.length,
    },
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
      smtpCredential: { select: { id: true, name: true } },
    },
  });

  return { campaign: updated };
}

export async function deleteCampaign(workspaceId: string, userId: string, campaignId: string) {
  const existing = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, workspaceId },
  });
  if (!existing) throw new NotFoundError("Campanha de e-mail");

  await prisma.emailCampaign.delete({ where: { id: campaignId } });

  await logAudit({
    userId,
    workspaceId,
    action: "email_campaign.delete",
    resourceId: campaignId,
  });

  return { success: true };
}

export async function sendCampaign(workspaceId: string, userId: string, campaignId: string) {
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, workspaceId },
  });
  if (!campaign) throw new NotFoundError("Campanha de e-mail");
  if (campaign.status === "SENDING") {
    throw new AppError("Esta campanha já está em andamento", 400);
  }

  const quota = await getEmailQuota(workspaceId);
  if (quota.remaining <= 0) {
    throw new AppError(
      `Limite diário de e-mails atingido (${quota.sentToday}/${quota.dailyLimit}). Tente novamente após a meia-noite.`,
      429,
    );
  }

  const smtp = await resolveSmtpConfig(workspaceId, campaign.smtpCredentialId);
  const recipients = await getEligibleRecipients(workspaceId, campaign.listId, campaign.tagId);

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENDING",
      sentAt: new Date(),
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
    },
  });

  executeBulkSend(campaign.id, recipients, campaign.subject, campaign.bodyContent, {
    transport: smtp.host ? { host: smtp.host, port: smtp.port, user: smtp.user, pass: smtp.pass } : null,
    from: smtp.from,
    quotaRemaining: quota.remaining,
  }).catch((err) => {
    console.error(`[Campaign Error] Campaign ${campaign.id} failed:`, err);
  });

  await logAudit({
    userId,
    workspaceId,
    action: "email_campaign.send",
    resourceId: campaign.id,
    metadata: { recipientCount: recipients.length, smtp: smtp.label },
  });

  return { success: true, message: `Envio iniciado para ${recipients.length} destinatários via "${smtp.label}".` };
}

async function executeBulkSend(
  campaignId: string,
  recipients: RecipientItem[],
  subject: string,
  bodyTemplate: string,
  opts: { transport: SmtpTransportConfig | null; from: string; quotaRemaining: number },
) {
  let sentCount = 0;
  let failedCount = 0;
  let quotaExhausted = false;

  for (const item of recipients) {
    if (!item.email) continue;
    if (sentCount >= opts.quotaRemaining) {
      quotaExhausted = true;
      break;
    }

    const personalizedBody = bodyTemplate.replace(/\{\{\s*nome\s*\}\}/gi, item.name || "Cliente");

    const result = await sendEmail({
      to: item.email,
      subject,
      html: personalizedBody,
      from: opts.from,
      transport: opts.transport,
    });

    if (result.success) {
      sentCount++;
      await prisma.emailLog.create({
        data: {
          campaignId,
          leadId: item.leadId || null,
          recipient: item.email,
          status: "SENT",
          sentAt: new Date(),
        },
      });
    } else {
      failedCount++;
      await prisma.emailLog.create({
        data: {
          campaignId,
          leadId: item.leadId || null,
          recipient: item.email,
          status: "FAILED",
          error: result.error || "Desconhecido",
        },
      });
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentCount, failedCount },
    });
  }

  const finalStatus = failedCount === recipients.length && recipients.length > 0 ? "FAILED" : "COMPLETED";

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
    },
  });

  if (quotaExhausted) {
    console.log(
      `[Campaign ${campaignId}] Cota diária atingida: ${sentCount} enviados, ${recipients.length - sentCount - failedCount} pendentes para o próximo dia.`,
    );
  }
}
