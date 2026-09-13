import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  subject: z.string().min(2, "Assunto é obrigatório"),
  bodyContent: z.string().min(5, "Conteúdo do e-mail é obrigatório"),
  listId: z.string().optional().nullable(),
  tagId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const listCampaignsSchema = z.object({
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "COMPLETED", "FAILED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsSchema>;
