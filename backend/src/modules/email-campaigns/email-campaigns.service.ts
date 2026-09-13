import { prisma } from "@/shared/database/prisma";
import { AppError, NotFoundError } from "@/shared/errors/AppError";
import { sendEmail } from "@/shared/utils/email";
import { logAudit } from "@/shared/utils/audit";
import { CreateCampaignInput, ListCampaignsQuery, UpdateCampaignInput } from "./email-campaigns.schema";

export async function createCampaign(
  workspaceId: string,
  userId: string,
  data: CreateCampaignInput,
) {
  // Find leads matching the filters that have a valid email
  const whereLead: any = {
    workspaceId,
    company: { email: { not: null } },
  };

  if (data.listId) {
    whereLead.lists = { some: { listId: data.listId } };
  }
  if (data.tagId) {
    whereLead.tags = { some: { tagId: data.tagId } };
  }

  const eligibleLeads = await prisma.lead.findMany({
    where: whereLead,
    include: { company: { select: { email: true, name: true } } },
  });

  const totalRecipients = eligibleLeads.length;

  const campaign = await prisma.emailCampaign.create({
    data: {
      workspaceId,
      createdById: userId,
      name: data.name,
      subject: data.subject,
      bodyContent: data.bodyContent,
      listId: data.listId || null,
      tagId: data.tagId || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      totalRecipients,
    },
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId,
    workspaceId,
    action: "email_campaign.create",
    resourceId: campaign.id,
    metadata: { name: campaign.name, totalRecipients },
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

  // Recalculate recipient count if list or tag changed
  const listId = data.listId !== undefined ? data.listId : existing.listId;
  const tagId = data.tagId !== undefined ? data.tagId : existing.tagId;

  const whereLead: any = {
    workspaceId,
    company: { email: { not: null } },
  };
  if (listId) whereLead.lists = { some: { listId } };
  if (tagId) whereLead.tags = { some: { tagId } };

  const totalRecipients = await prisma.lead.count({ where: whereLead });

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      name: data.name ?? existing.name,
      subject: data.subject ?? existing.subject,
      bodyContent: data.bodyContent ?? existing.bodyContent,
      listId,
      tagId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduledAt,
      totalRecipients,
    },
    include: {
      list: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
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
  if (campaign.status === "SENDING" || campaign.status === "COMPLETED") {
    throw new AppError("Esta campanha já foi enviada ou está em andamento", 400);
  }

  // Update status to SENDING
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", sentAt: new Date() },
  });

  // Fetch recipients
  const whereLead: any = {
    workspaceId,
    company: { email: { not: null } },
  };
  if (campaign.listId) whereLead.lists = { some: { listId: campaign.listId } };
  if (campaign.tagId) whereLead.tags = { some: { tagId: campaign.tagId } };

  const leads = await prisma.lead.findMany({
    where: whereLead,
    include: { company: { select: { email: true, name: true } } },
  });

  // Asynchronous sending in background
  executeBulkSend(campaign.id, leads, campaign.subject, campaign.bodyContent).catch((err) => {
    console.error(`[Campaign Error] Campaign ${campaign.id} failed:`, err);
  });

  await logAudit({
    userId,
    workspaceId,
    action: "email_campaign.send",
    resourceId: campaign.id,
    metadata: { recipientCount: leads.length },
  });

  return { success: true, message: `Envio iniciado para ${leads.length} destinatários.` };
}

async function executeBulkSend(
  campaignId: string,
  leads: Array<{ id: string; company: { email: string | null; name: string } }>,
  subject: string,
  bodyTemplate: string,
) {
  let sentCount = 0;
  let failedCount = 0;

  for (const lead of leads) {
    const email = lead.company.email;
    if (!email) continue;

    // Replace basic variables in template
    const personalizedBody = bodyTemplate.replace(/\{\{\s*nome\s*\}\}/gi, lead.company.name || "Cliente");

    const result = await sendEmail({
      to: email,
      subject,
      html: personalizedBody,
    });

    if (result.success) {
      sentCount++;
      await prisma.emailLog.create({
        data: {
          campaignId,
          leadId: lead.id,
          recipient: email,
          status: "SENT",
          sentAt: new Date(),
        },
      });
    } else {
      failedCount++;
      await prisma.emailLog.create({
        data: {
          campaignId,
          leadId: lead.id,
          recipient: email,
          status: "FAILED",
          error: result.error || "Desconhecido",
        },
      });
    }

    // Update campaign counters in real-time
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentCount, failedCount },
    });
  }

  const finalStatus = failedCount === leads.length && leads.length > 0 ? "FAILED" : "COMPLETED";

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      totalRecipients: leads.length,
      sentCount,
      failedCount,
    },
  });
}
