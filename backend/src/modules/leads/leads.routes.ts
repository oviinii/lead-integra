import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from "./leads.schema";
import {
  changeLeadStatus,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead,
} from "./leads.service";

export default async function leadsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get(
      "/",
      { preValidation: validate(listLeadsSchema) },
      async (req) => {
        const q = (req as any).query as Parameters<typeof listLeads>[1];
        return listLeads((req as any).workspace.workspaceId, q);
      },
    );

    instance.post(
      "/",
      { preValidation: validate(createLeadSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return createLead(ctx.workspaceId, ctx.userId, (req as any).body);
      },
    );

    instance.get<{ Params: { id: string } }>("/:id", async (req) =>
      getLead((req as any).workspace.workspaceId, req.params.id),
    );

    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateLeadSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return updateLead(ctx.workspaceId, ctx.userId, req.params.id, (req as any).body);
      },
    );

    instance.delete<{ Params: { id: string } }>("/:id", async (req) => {
      const ctx = (req as any).workspace;
      return deleteLead(ctx.workspaceId, ctx.userId, req.params.id);
    });

    instance.post<{
      Params: { id: string };
      Body: { status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "ARCHIVED" };
    }>("/:id/status", async (req) => {
      const ctx = (req as any).workspace;
      return changeLeadStatus(ctx.workspaceId, ctx.userId, req.params.id, req.body.status);
    });
  });
}
