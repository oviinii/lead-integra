import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { addLeadToListSchema, createListSchema, updateListSchema } from "./lists.schema";
import {
  addLeadsToList,
  createList,
  deleteList,
  getList,
  listLists,
  removeLeadFromList,
  updateList,
} from "./lists.service";

export default async function listsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get("/", async (req) => listLists((req as any).workspace.workspaceId));
    instance.post(
      "/",
      { preValidation: validate(createListSchema) },
      async (req) => createList((req as any).workspace.workspaceId, (req as any).body),
    );

    instance.get<{ Params: { id: string } }>("/:id", async (req) =>
      getList((req as any).workspace.workspaceId, req.params.id),
    );
    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateListSchema) },
      async (req) => updateList((req as any).workspace.workspaceId, req.params.id, (req as any).body),
    );
    instance.delete<{ Params: { id: string } }>("/:id", async (req) =>
      deleteList((req as any).workspace.workspaceId, req.params.id),
    );

    instance.post<{ Params: { id: string } }>(
      "/:id/items",
      { preValidation: validate(addLeadToListSchema) },
      async (req) =>
        addLeadsToList((req as any).workspace.workspaceId, req.params.id, (req as any).body.leadIds),
    );
    instance.delete<{ Params: { id: string; leadId: string } }>("/:id/items/:leadId", async (req) =>
      removeLeadFromList((req as any).workspace.workspaceId, req.params.id, req.params.leadId),
    );
  });
}
