import { FastifyInstance } from "fastify";
import { authenticate } from "@/shared/middleware/auth";
import { prisma } from "@/shared/database/prisma";

export default async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);

    instance.get("/", async (req) => {
      const items = await prisma.notification.findMany({
        where: { userId: req.authUser!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { notifications: items };
    });

    instance.patch<{ Params: { id: string } }>("/:id/read", async (req) => {
      await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.authUser!.id },
        data: { readAt: new Date() },
      });
      return { success: true };
    });

    instance.post("/read-all", async (req) => {
      await prisma.notification.updateMany({
        where: { userId: req.authUser!.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { success: true };
    });
  });
}
