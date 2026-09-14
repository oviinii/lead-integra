import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import {
  createCampaignSchema,
  listCampaignsSchema,
  updateCampaignSchema,
} from "./email-campaigns.schema";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaignRecipients,
  getEmailQuota,
  listCampaigns,
  previewRecipients,
  sendCampaign,
  updateCampaign,
} from "./email-campaigns.service";

export default async function emailCampaignsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get(
      "/",
      { preValidation: validate(listCampaignsSchema) },
      async (req) => {
        const query = (req as any).query as Parameters<typeof listCampaigns>[1];
        return listCampaigns((req as any).workspace.workspaceId, query);
      },
    );

    instance.post(
      "/",
      { preValidation: validate(createCampaignSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return createCampaign(ctx.workspaceId, ctx.userId, (req as any).body);
      },
    );

    instance.get("/quota", async (req) => {
      const ctx = (req as any).workspace;
      return getEmailQuota(ctx.workspaceId);
    });

    instance.get("/recipients-preview", async (req) => {
      const ctx = (req as any).workspace;
      const query = (req as any).query as { listId?: string; tagId?: string };
      return previewRecipients(ctx.workspaceId, query.listId, query.tagId);
    });

    instance.get<{ Params: { id: string } }>("/:id", async (req) => {
      const ctx = (req as any).workspace;
      return getCampaign(ctx.workspaceId, req.params.id);
    });

    instance.get<{ Params: { id: string } }>("/:id/recipients", async (req) => {
      const ctx = (req as any).workspace;
      return getCampaignRecipients(ctx.workspaceId, req.params.id);
    });

    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateCampaignSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return updateCampaign(ctx.workspaceId, ctx.userId, req.params.id, (req as any).body);
      },
    );

    instance.delete<{ Params: { id: string } }>("/:id", async (req) => {
      const ctx = (req as any).workspace;
      return deleteCampaign(ctx.workspaceId, ctx.userId, req.params.id);
    });

    instance.post<{ Params: { id: string } }>("/:id/send", async (req) => {
      const ctx = (req as any).workspace;
      return sendCampaign(ctx.workspaceId, ctx.userId, req.params.id);
    });
  });
}
