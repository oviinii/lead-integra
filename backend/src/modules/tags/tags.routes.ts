import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { createTagSchema } from "./tags.schema";
import {
  addTagToLead,
  createTag,
  deleteTag,
  listTags,
  removeTagFromLead,
} from "./tags.service";

export default async function tagsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get("/", async (req) => listTags((req as any).workspace.workspaceId));
    instance.post(
      "/",
      { preValidation: validate(createTagSchema) },
      async (req) => createTag((req as any).workspace.workspaceId, (req as any).body),
    );
    instance.delete<{ Params: { id: string } }>("/:id", async (req) =>
      deleteTag((req as any).workspace.workspaceId, req.params.id),
    );

    instance.post<{ Params: { leadId: string; tagId: string } }>(
      "/leads/:leadId/:tagId",
      async (req) =>
        addTagToLead((req as any).workspace.workspaceId, req.params.leadId, req.params.tagId),
    );
    instance.delete<{ Params: { leadId: string; tagId: string } }>(
      "/leads/:leadId/:tagId",
      async (req) =>
        removeTagFromLead((req as any).workspace.workspaceId, req.params.leadId, req.params.tagId),
    );
  });
}
