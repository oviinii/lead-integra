import { FastifyInstance } from "fastify";
import { authenticate, superAdminOnly } from "@/shared/middleware/auth";
import { prisma } from "@/shared/database/prisma";
import { AppError } from "@/shared/errors/AppError";

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", superAdminOnly);

    instance.get("/overview", async () => {
      const [users, workspaces, leads, searches, exports, providers] = await Promise.all([
        prisma.user.count(),
        prisma.workspace.count(),
        prisma.lead.count(),
        prisma.search.count(),
        prisma.export.count(),
        prisma.provider.findMany(),
      ]);

      const creditTx = await prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { amount: { lt: 0 } },
      });

      return {
        users,
        workspaces,
        leads,
        searches,
        exports,
        creditsConsumed: Math.abs(creditTx._sum.amount ?? 0),
        providers,
      };
    });

    instance.get("/analytics", async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [searchesToday, leadsToday, newUsersWeek, activeWorkspaces] = await Promise.all([
        prisma.search.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.workspace.count({ where: { isActive: true } }),
      ]);

      return {
        searchesToday,
        leadsToday,
        newUsersWeek,
        activeWorkspaces,
      };
    });

     instance.get("/analytics/daily", async () => {
       const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

       const [dailySearches, dailyUsers] = await Promise.all([
         prisma.search.groupBy({
           by: ["createdAt"],
           where: { createdAt: { gte: thirtyDaysAgo } },
           _count: { id: true },
           orderBy: { createdAt: "asc" },
         }),
         prisma.user.groupBy({
           by: ["createdAt"],
           where: { createdAt: { gte: thirtyDaysAgo } },
           _count: { id: true },
           orderBy: { createdAt: "asc" },
         }),
       ]);

      const formatDaily = (items: Array<{ createdAt: Date; _count: { id: number } }>) =>
        items.map((item) => ({
          date: item.createdAt.toISOString().split("T")[0],
          count: item._count.id,
        }));

      return {
        dailySearches: formatDaily(dailySearches),
        dailyUsers: formatDaily(dailyUsers),
      };
    });

    instance.get("/credits/overview", async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalCredits, consumedThisMonth, availableCredits, activeWorkspaces] = await Promise.all([
        prisma.creditTransaction.aggregate({
          _sum: { amount: true },
        }),
        prisma.creditTransaction.aggregate({
          _sum: { amount: true },
          where: { amount: { lt: 0 }, createdAt: { gte: monthStart } },
        }),
        prisma.creditBalance.aggregate({ _sum: { balance: true } }),
        prisma.workspace.count({ where: { isActive: true } }),
      ]);

      return {
        totalCredits: totalCredits._sum.amount || 0,
        consumedThisMonth: Math.abs(consumedThisMonth._sum.amount || 0),
        availableCredits: availableCredits._sum.balance || 0,
        activeWorkspaces,
      };
    });

    instance.get("/credit-transactions", async () => {
      const transactions = await prisma.creditTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { workspace: { select: { name: true } } },
      });
      return { transactions };
    });

    // Add credits to a workspace
    instance.post<{
      Body: { workspaceId: string; amount: number; description?: string };
    }>("/credits/add", async (req) => {
      const { workspaceId, amount, description } = req.body;

      if (!workspaceId || !amount || amount <= 0) {
        throw new AppError("workspaceId e amount (positivo) são obrigatórios", 400, "INVALID_INPUT");
      }

      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) {
        throw new AppError("Workspace não encontrado", 404, "WORKSPACE_NOT_FOUND");
      }

      // Update credit balance and create transaction
      const [balance] = await prisma.$transaction([
        prisma.creditBalance.upsert({
          where: { workspaceId },
          update: { balance: { increment: amount }, lifetime: { increment: amount } },
          create: { workspaceId, balance: amount, lifetime: amount },
        }),
        prisma.creditTransaction.create({
          data: {
            workspaceId,
            type: "PURCHASE",
            amount,
            description: description || `Créditos adicionados pelo admin`,
          },
        }),
      ]);

      return { balance: { balance: balance.balance, lifetime: balance.lifetime } };
    });

    instance.get("/plans", async () => {
      const plans = await prisma.plan.findMany({ orderBy: { priceCents: "asc" } });
      return { plans };
    });

    instance.patch<{
      Params: { id: string };
      Body: {
        name?: string;
        description?: string;
        priceCents?: number;
        creditsMonthly?: number;
        maxUsers?: number;
        maxSearches?: number;
        maxExports?: number;
        hasApi?: boolean;
        features?: any;
        isActive?: boolean;
      };
    }>("/plans/:id", async (req) => {
      const plan = await prisma.plan.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { plan };
    });

    instance.get("/config", async () => {
      // Return config from env or defaults
      return {
        platformName: process.env.APP_NAME || "Lead Generator",
        baseUrl: process.env.APP_URL || "http://localhost:5173",
        maintenanceMode: false,
        require2FA: false,
        sessionTimeout: 24,
        freeCredits: Number(process.env.APP_PLAN_FREE_CREDITS || 100),
        welcomeBonus: 0,
        searchCost: 1,
        enrichmentCost: 1,
        sendWelcomeEmail: true,
        lowCreditAlerts: true,
        weeklyReports: false,
        defaultTheme: "system",
        primaryColor: "#6366f1",
      };
    });

    // --- Existing routes ---
    instance.get("/users", async () => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          isSuperAdmin: true,
          createdAt: true,
          _count: { select: { ownedWorkspaces: true } },
        },
      });
      return { users };
    });

    instance.patch<{ Params: { id: string }; Body: { isActive?: boolean; isSuperAdmin?: boolean } }>(
      "/users/:id",
      async (req) => {
        const user = await prisma.user.update({
          where: { id: req.params.id },
          data: req.body,
        });
        return { user: { id: user.id, isActive: user.isActive, isSuperAdmin: user.isSuperAdmin } };
      },
    );

    instance.get("/workspaces", async () => {
      const workspaces = await prisma.workspace.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          owner: { select: { name: true, email: true } },
          creditBalance: true,
          _count: { select: { members: true, leads: true, companies: true } },
        },
      });
      return { workspaces };
    });

    instance.get("/providers", async () => {
      const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
      return { providers };
    });

    instance.patch<{ Params: { id: string }; Body: { isActive?: boolean; config?: any } }>(
      "/providers/:id",
      async (req) => {
        const provider = await prisma.provider.update({
          where: { id: req.params.id },
          data: { isActive: req.body.isActive, config: req.body.config },
        });
        return { provider };
      },
    );
  });
}