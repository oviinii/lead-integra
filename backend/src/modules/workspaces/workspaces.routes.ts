import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberSchema,
  updateWorkspaceSchema,
} from "./workspaces.schema";
import {
  createWorkspace,
  getWorkspace,
  inviteMember,
  listMembers,
  listWorkspaces,
  removeMember,
  updateMember,
  updateWorkspace,
} from "./workspaces.service";

export default async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);

    instance.get("/", async (req) => listWorkspaces(req));
    instance.post(
      "/",
      { preValidation: validate(createWorkspaceSchema) },
      async (req) => createWorkspace(instance, req as any),
    );

    instance.get<{ Params: { id: string } }>("/:id", async (req) => getWorkspace(req as any));
    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateWorkspaceSchema) },
      async (req) => updateWorkspace(req as any),
    );

    instance.get<{ Params: { id: string } }>("/:id/members", async (req) => listMembers(req as any));
    instance.post<{ Params: { id: string } }>(
      "/:id/members",
      { preValidation: validate(inviteMemberSchema) },
      async (req) => inviteMember(req as any),
    );
    instance.patch<{ Params: { id: string; memberId: string } }>(
      "/:id/members/:memberId",
      { preValidation: validate(updateMemberSchema) },
      async (req) => updateMember(req as any),
    );
    instance.delete<{ Params: { id: string; memberId: string } }>(
      "/:id/members/:memberId",
      async (req) => removeMember(req as any),
    );
  });
}
