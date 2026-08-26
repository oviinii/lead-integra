import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { exportLeadsSchema } from "./exports.schema";
import { csvFilename, exportCompanies, exportLeads } from "./exports.service";
import { prisma } from "@/shared/database/prisma";
import { logAudit } from "@/shared/utils/audit";

export default async function exportsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.post(
      "/",
      { preValidation: validate(exportLeadsSchema) },
      async (req, reply) => {
        const ctx = (req as any).workspace;
        const body = (req as any).body;
        const exportRow = await prisma.export.create({
          data: {
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
            type: body.type,
            format: "csv",
            status: "PROCESSING",
            filters: body as any,
          },
        });

        try {
          const csv =
            body.type === "companies"
              ? await exportCompanies(ctx.workspaceId)
              : await exportLeads(ctx.workspaceId, body.listId);

          await prisma.export.update({
            where: { id: exportRow.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              rowCount: csv.split("\n").length - 1,
            },
          });

          await logAudit({
            userId: ctx.userId,
            workspaceId: ctx.workspaceId,
            action: "export.create",
            resourceId: exportRow.id,
            metadata: { type: body.type, rowCount: csv.split("\n").length - 1 },
          });

          reply.header("Content-Type", "text/csv; charset=utf-8");
          reply.header(
            "Content-Disposition",
            `attachment; filename="${csvFilename(body.type)}"`,
          );
          return `\uFEFF${csv}`;
        } catch (err) {
          await prisma.export.update({
            where: { id: exportRow.id },
            data: { status: "FAILED", errorMessage: (err as Error).message, completedAt: new Date() },
          });
          throw err;
        }
      },
    );

    instance.get("/", async (req) => {
      const ctx = (req as any).workspace;
      const exports = await prisma.export.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { exports };
    });
  });
}
