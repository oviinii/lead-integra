import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { listCompaniesSchema, updateCompanySchema } from "./companies.schema";
import { getCompany, listCompanies, lookupCompanyCnpj, updateCompany } from "./companies.service";

export default async function companiesRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver());

    instance.get(
      "/",
      { preValidation: validate(listCompaniesSchema) },
      async (req) => {
        const q = (req as any).query as Parameters<typeof listCompanies>[1];
        return listCompanies((req as any).workspace.workspaceId, q);
      },
    );

    instance.get<{ Params: { id: string } }>("/:id", async (req) => getCompany(req as any));

    instance.get<{ Params: { id: string } }>("/:id/lookup-cnpj", async (req) => lookupCompanyCnpj(req as any));

    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateCompanySchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return updateCompany(ctx.workspaceId, req.params.id, (req as any).body);
      },
    );
  });
}
