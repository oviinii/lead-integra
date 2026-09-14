import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import {
  createSmtpCredentialSchema,
  listSmtpCredentialsSchema,
  updateSmtpCredentialSchema,
} from "./smtp-credentials.schema";
import {
  createSmtpCredential,
  deleteSmtpCredential,
  listSmtpCredentials,
  updateSmtpCredential,
} from "./smtp-credentials.service";

export default async function smtpCredentialsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.get(
      "/",
      { preValidation: validate(listSmtpCredentialsSchema) },
      async (req) => {
        const query = (req as any).query as Parameters<typeof listSmtpCredentials>[1];
        return listSmtpCredentials((req as any).workspace.workspaceId, query);
      },
    );

    instance.post(
      "/",
      { preValidation: validate(createSmtpCredentialSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return createSmtpCredential(ctx.workspaceId, ctx.userId, (req as any).body);
      },
    );

    instance.patch<{ Params: { id: string } }>(
      "/:id",
      { preValidation: validate(updateSmtpCredentialSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        return updateSmtpCredential(ctx.workspaceId, ctx.userId, req.params.id, (req as any).body);
      },
    );

    instance.delete<{ Params: { id: string } }>("/:id", async (req) => {
      const ctx = (req as any).workspace;
      return deleteSmtpCredential(ctx.workspaceId, ctx.userId, req.params.id);
    });
  });
}
