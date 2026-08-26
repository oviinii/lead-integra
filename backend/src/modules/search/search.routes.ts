import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { createSearchSchema, listSearchSchema } from "./search.schema";
import {
  cancelSearch,
  createSearch,
  getSearch,
  listSearches,
} from "./search.service";

export default async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get(
      "/",
      { preValidation: validate(listSearchSchema) },
      async (req) => {
        const q = (req as any).query as Parameters<typeof listSearches>[1];
        return listSearches((req as any).workspace.workspaceId, q);
      },
    );

    instance.post(
      "/",
      { preValidation: validate(createSearchSchema) },
      async (req) => createSearch(req as any),
    );

    instance.get<{ Params: { id: string } }>("/:id", async (req) => {
      return getSearch((req as any).workspace.workspaceId, req.params.id);
    });

    instance.post<{ Params: { id: string } }>("/:id/cancel", async (req) => {
      return cancelSearch((req as any).workspace.workspaceId, req.params.id);
    });
  });
}
