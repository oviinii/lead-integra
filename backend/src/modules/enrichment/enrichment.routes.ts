import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { enrichCompanySchema, batchEnrichSchema } from "./enrichment.schema";
import { batchEnrichLeads, enrichCompany, getEnrichmentProviders, listEnrichmentJobs, getEnrichedCompanyIds } from "./enrichment.service";

export default async function enrichmentRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get("/providers", async () => getEnrichmentProviders());

    instance.get("/jobs", async (req) =>
      listEnrichmentJobs((req as any).workspace.workspaceId),
    );

    instance.get("/enriched-companies", async (req) =>
      getEnrichedCompanyIds((req as any).workspace.workspaceId),
    );

    instance.post("/companies/:id", { preValidation: validate(enrichCompanySchema) }, async (req) => {
      const ctx = (req as any).workspace;
      const body = (req as any).body;
      const params = req.params as { id: string };
      return enrichCompany(ctx.workspaceId, ctx.userId, params.id, body.provider, body.fields);
    });

    instance.post(
      "/batch",
      { preValidation: validate(batchEnrichSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        const body = (req as any).body;
        return batchEnrichLeads(ctx.workspaceId, ctx.userId, body.leadIds, body.provider, body.fields);
      },
    );
  });
}
