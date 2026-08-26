import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { prisma } from "@/shared/database/prisma";

export default async function creditsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver());

    instance.get("/", async (req) => {
      const ctx = (req as any).workspace;
      const balance = await prisma.creditBalance.findUnique({
        where: { workspaceId: ctx.workspaceId },
      });
      return {
        balance: balance?.balance ?? 0,
        lifetime: balance?.lifetime ?? 0,
      };
    });

    instance.get("/transactions", async (req) => {
      const ctx = (req as any).workspace;
      const transactions = await prisma.creditTransaction.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return { transactions };
    });
  });
}
