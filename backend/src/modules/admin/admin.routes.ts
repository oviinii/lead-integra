import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import argon2 from "argon2";
import { authenticate, superAdminOnly } from "@/shared/middleware/auth";
import { prisma } from "@/shared/database/prisma";
import { AppError } from "@/shared/errors/AppError";
import { logAudit } from "@/shared/utils/audit";
import { sendEmail } from "@/shared/utils/email";
import { env } from "@/config/env";
import {
  getPlatformConfig,
  setPlatformConfigValue,
  PLATFORM_CONFIG_KEYS,
} from "@/shared/utils/platformSettings";
import {
  maskProviderKey,
  parsePagination,
  slugifyWorkspace,
  generateTempPassword,
  bucketizeDaily,
} from "./admin.utils";

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

     instance.get("/analytics/daily", async (req) => {
       const query = req.query as { days?: unknown };
       const rawDays = Number(query.days);
       const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;
       const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

       const [searches, users] = await Promise.all([
         prisma.search.findMany({
           where: { createdAt: { gte: since } },
           select: { createdAt: true },
         }),
         prisma.user.findMany({
           where: { createdAt: { gte: since } },
           select: { createdAt: true },
         }),
       ]);

       return {
         days,
         dailySearches: bucketizeDaily(searches.map((s) => s.createdAt), days),
         dailyUsers: bucketizeDaily(users.map((u) => u.createdAt), days),
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

    instance.get("/credit-transactions", async (req) => {
      const query = req.query as { page?: unknown; pageSize?: unknown; type?: unknown; workspaceId?: unknown; search?: unknown };
      const { page, pageSize, skip, take } = parsePagination(query);

      const where: Record<string, unknown> = {};
      if (typeof query.type === "string" && query.type.trim()) {
        where.type = query.type.trim();
      }
      if (typeof query.workspaceId === "string" && query.workspaceId.trim()) {
        where.workspaceId = query.workspaceId.trim();
      }
      if (typeof query.search === "string" && query.search.trim()) {
        const s = query.search.trim();
        where.OR = [
          { description: { contains: s, mode: "insensitive" } },
          { workspace: { name: { contains: s, mode: "insensitive" } } },
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: { workspace: { select: { name: true } } },
        }),
        prisma.creditTransaction.count({ where }),
      ]);
      return { transactions, total, page, pageSize };
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

    instance.get("/plans/:id", async (req) => {
      const { id } = req.params as { id: string };
      const plan = await prisma.plan.findUnique({ where: { id } });
      if (!plan) throw new AppError("Plano não encontrado", 404, "PLAN_NOT_FOUND");
      return { plan };
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
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.plan.update",
        resource: "Plan",
        resourceId: plan.id,
        ip: req.ip,
      });
      return { plan };
    });

    instance.get("/config", async () => {
      return getPlatformConfig();
    });

    instance.patch<{ Body: Record<string, string | number | boolean> }>("/config", async (req) => {
      const body = req.body ?? {};
      const unknownKeys = Object.keys(body).filter((k) => !PLATFORM_CONFIG_KEYS.includes(k));
      if (unknownKeys.length > 0) {
        throw new AppError(`Chaves de configuração inválidas: ${unknownKeys.join(", ")}`, 400, "INVALID_INPUT");
      }
      for (const [key, value] of Object.entries(body)) {
        await setPlatformConfigValue(key, value);
      }
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.config.update",
        resource: "PlatformSetting",
        metadata: body,
        ip: req.ip,
      });
      return getPlatformConfig();
    });

    // --- Existing routes ---
    instance.get("/users", async (req) => {
      const query = req.query as { search?: unknown; page?: unknown; pageSize?: unknown };
      const { page, pageSize, skip, take } = parsePagination(query);

      const where: Record<string, unknown> = {};
      if (typeof query.search === "string" && query.search.trim()) {
        const s = query.search.trim();
        where.OR = [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            isSuperAdmin: true,
            createdAt: true,
            _count: { select: { ownedWorkspaces: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      return { users, total, page, pageSize };
    });

    instance.get("/users/:id", async (req) => {
      const { id } = req.params as { id: string };
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          isSuperAdmin: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          ownedWorkspaces: {
            select: { id: true, name: true, slug: true, plan: true, isActive: true },
          },
          workspaceMembers: {
            select: {
              role: true,
              workspace: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { leadsCreated: true, searches: true } },
        },
      });
      if (!user) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
      return { user };
    });

    instance.post<{
      Body: { name: string; email: string; isSuperAdmin?: boolean; createWorkspace?: boolean; workspaceName?: string };
    }>("/users", async (req) => {
      const { name, email, isSuperAdmin, createWorkspace, workspaceName } = req.body ?? {};

      if (!name?.trim() || !email?.trim()) {
        throw new AppError("Nome e e-mail são obrigatórios", 400, "INVALID_INPUT");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        throw new AppError("E-mail inválido", 400, "INVALID_INPUT");
      }

      const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (existing) throw new AppError("E-mail já cadastrado", 409, "EMAIL_TAKEN");

      const tempPassword = generateTempPassword();
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            name: name.trim(),
            email: email.trim(),
            passwordHash,
            isSuperAdmin: isSuperAdmin === true,
            emailVerifiedAt: new Date(),
          },
        });
        if (createWorkspace) {
          const wsName = workspaceName?.trim() || `${name.trim().split(" ")[0]} Workspace`;
          await tx.workspace.create({
            data: {
              name: wsName,
              slug: slugifyWorkspace(wsName),
              ownerId: u.id,
              members: { create: { userId: u.id, role: "OWNER" } },
              creditBalance: { create: { balance: env.PLANS.FREE, lifetime: env.PLANS.FREE } },
              creditTransactions: {
                create: {
                  type: "BONUS",
                  amount: env.PLANS.FREE,
                  description: "Bônus inicial - Plano FREE",
                },
              },
            },
          });
        }
        return u;
      });

      await logAudit({
        userId: req.authUser?.id,
        action: "admin.user.create",
        resource: "User",
        resourceId: user.id,
        ip: req.ip,
      });

      // Welcome email with temporary password (mocked when SMTP is not configured)
      const config = await getPlatformConfig();
      const loginUrl = `${config.baseUrl}/login`;
      const emailResult = await sendEmail({
        to: user.email,
        subject: `Sua conta em ${config.platformName} foi criada`,
        html: [
          `<p>Olá, ${user.name}!</p>`,
          `<p>Uma conta foi criada para você em <strong>${config.platformName}</strong>.</p>`,
          `<p><strong>E-mail:</strong> ${user.email}<br/><strong>Senha temporária:</strong> ${tempPassword}</p>`,
          `<p>Acesse <a href="${loginUrl}">${loginUrl}</a> e troque sua senha após o primeiro login.</p>`,
        ].join(""),
      });

      return {
        user: { id: user.id, name: user.name, email: user.email, isActive: user.isActive, isSuperAdmin: user.isSuperAdmin },
        emailSent: emailResult.success && !emailResult.mocked,
        emailMocked: emailResult.mocked === true,
      };
    });

    instance.delete("/users/:id", async (req) => {
      const { id } = req.params as { id: string };
      const actorId = req.authUser?.id;
      if (actorId && actorId === id) {
        throw new AppError("Você não pode excluir a própria conta", 400, "INVALID_INPUT");
      }
      const target = await prisma.user.findUnique({ where: { id }, select: { id: true, isSuperAdmin: true } });
      if (!target) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
      try {
        await prisma.user.delete({ where: { id } });
      } catch {
        throw new AppError(
          "Não foi possível excluir: o usuário possui workspaces ou dados vinculados. Desative-o em vez disso.",
          400,
          "USER_HAS_DEPENDENCIES",
        );
      }
      await logAudit({
        userId: actorId,
        action: "admin.user.delete",
        resource: "User",
        resourceId: id,
        ip: req.ip,
      });
      return { deleted: true };
    });

    instance.patch<{ Params: { id: string }; Body: { isActive?: boolean; isSuperAdmin?: boolean } }>(
      "/users/:id",
      async (req) => {
        const actorId = req.authUser?.id;
        const { isActive, isSuperAdmin } = req.body ?? {};
        const data: { isActive?: boolean; isSuperAdmin?: boolean } = {};
        if (typeof isActive === "boolean") data.isActive = isActive;
        if (typeof isSuperAdmin === "boolean") data.isSuperAdmin = isSuperAdmin;
        if (Object.keys(data).length === 0) {
          throw new AppError("Nenhum campo válido para atualizar", 400, "INVALID_INPUT");
        }
        if (actorId && actorId === req.params.id) {
          if (data.isActive === false) {
            throw new AppError("Você não pode desativar a própria conta", 400, "INVALID_INPUT");
          }
          if (data.isSuperAdmin === false) {
            throw new AppError("Você não pode remover seu próprio acesso de Super Admin", 400, "INVALID_INPUT");
          }
        }
        const user = await prisma.user.update({
          where: { id: req.params.id },
          data,
        });
        await logAudit({
          userId: actorId,
          action: "admin.user.update",
          resource: "User",
          resourceId: user.id,
          metadata: data,
          ip: req.ip,
        });
        return { user: { id: user.id, isActive: user.isActive, isSuperAdmin: user.isSuperAdmin } };
      },
    );

    instance.get("/workspaces", async (req) => {
      const query = req.query as { search?: unknown; page?: unknown; pageSize?: unknown; plan?: unknown };
      const { page, pageSize, skip, take } = parsePagination(query);

      const where: Record<string, unknown> = {};
      if (typeof query.search === "string" && query.search.trim()) {
        const s = query.search.trim();
        where.OR = [
          { name: { contains: s, mode: "insensitive" } },
          { slug: { contains: s, mode: "insensitive" } },
          { owner: { email: { contains: s, mode: "insensitive" } } },
        ];
      }
      if (typeof query.plan === "string" && query.plan.trim()) {
        where.plan = query.plan.trim();
      }

      const [workspaces, total] = await Promise.all([
        prisma.workspace.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            owner: { select: { name: true, email: true } },
            creditBalance: true,
            _count: { select: { members: true, leads: true, companies: true } },
          },
        }),
        prisma.workspace.count({ where }),
      ]);
      return { workspaces, total, page, pageSize };
    });

    instance.get("/workspaces/:id", async (req) => {
      const { id } = req.params as { id: string };
      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          creditBalance: true,
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { members: true, leads: true, companies: true, searches: true, exports: true } },
        },
      });
      if (!workspace) throw new AppError("Workspace não encontrado", 404, "WORKSPACE_NOT_FOUND");
      return { workspace };
    });

    instance.post<{
      Body: { name: string; ownerEmail: string; plan?: "FREE" | "STARTER" | "PRO" | "ENTERPRISE" };
    }>("/workspaces", async (req) => {
      const { name, ownerEmail, plan } = req.body ?? {};
      if (!name?.trim() || !ownerEmail?.trim()) {
        throw new AppError("Nome e e-mail do dono são obrigatórios", 400, "INVALID_INPUT");
      }
      const owner = await prisma.user.findUnique({ where: { email: ownerEmail.trim() } });
      if (!owner) throw new AppError("Usuário dono não encontrado", 404, "USER_NOT_FOUND");

      const workspace = await prisma.workspace.create({
        data: {
          name: name.trim(),
          slug: slugifyWorkspace(name.trim()),
          ownerId: owner.id,
          plan: plan ?? "FREE",
          members: { create: { userId: owner.id, role: "OWNER" } },
          creditBalance: { create: { balance: env.PLANS.FREE, lifetime: env.PLANS.FREE } },
          creditTransactions: {
            create: { type: "BONUS", amount: env.PLANS.FREE, description: "Bônus inicial - Plano FREE" },
          },
        },
      });
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.workspace.create",
        resource: "Workspace",
        resourceId: workspace.id,
        ip: req.ip,
      });
      return { workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, plan: workspace.plan } };
    });

    instance.patch<{
      Params: { id: string };
      Body: { name?: string; plan?: "FREE" | "STARTER" | "PRO" | "ENTERPRISE"; isActive?: boolean };
    }>("/workspaces/:id", async (req) => {
      const { name, plan, isActive } = req.body ?? {};
      const data: { name?: string; plan?: "FREE" | "STARTER" | "PRO" | "ENTERPRISE"; isActive?: boolean } = {};
      if (typeof name === "string" && name.trim()) data.name = name.trim();
      if (plan && ["FREE", "STARTER", "PRO", "ENTERPRISE"].includes(plan)) data.plan = plan;
      if (typeof isActive === "boolean") data.isActive = isActive;
      if (Object.keys(data).length === 0) {
        throw new AppError("Nenhum campo válido para atualizar", 400, "INVALID_INPUT");
      }
      const workspace = await prisma.workspace.update({ where: { id: req.params.id }, data });
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.workspace.update",
        resource: "Workspace",
        resourceId: workspace.id,
        metadata: data,
        ip: req.ip,
      });
      return { workspace };
    });

    instance.delete("/workspaces/:id", async (req) => {
      const { id } = req.params as { id: string };
      const workspace = await prisma.workspace.findUnique({ where: { id }, select: { id: true } });
      if (!workspace) throw new AppError("Workspace não encontrado", 404, "WORKSPACE_NOT_FOUND");
      await prisma.workspace.delete({ where: { id } });
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.workspace.delete",
        resource: "Workspace",
        resourceId: id,
        ip: req.ip,
      });
      return { deleted: true };
    });

    instance.get("/providers", async () => {
      const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
      // Never expose raw keys in list responses
      return {
        providers: providers.map((p) => ({ ...p, key: undefined, maskedKey: maskProviderKey(p.key) })),
      };
    });

    instance.get("/providers/:id", async (req) => {
      const { id } = req.params as { id: string };
      const provider = await prisma.provider.findUnique({ where: { id } });
      if (!provider) throw new AppError("Provider não encontrado", 404, "PROVIDER_NOT_FOUND");
      return { provider: { ...provider, maskedKey: maskProviderKey(provider.key) } };
    });

    instance.post<{
      Body: { key: string; name: string; type: string; isActive?: boolean; config?: Prisma.InputJsonValue };
    }>("/providers", async (req) => {
      const { key, name, type, isActive, config } = req.body ?? {};
      if (!key?.trim() || !name?.trim() || !type?.trim()) {
        throw new AppError("key, name e type são obrigatórios", 400, "INVALID_INPUT");
      }
      const existing = await prisma.provider.findUnique({ where: { key: key.trim() } });
      if (existing) throw new AppError("Já existe um provider com essa key", 409, "PROVIDER_KEY_TAKEN");
      const provider = await prisma.provider.create({
        data: { key: key.trim(), name: name.trim(), type: type.trim(), isActive: isActive === true, config: config ?? undefined },
      });
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.provider.create",
        resource: "Provider",
        resourceId: provider.id,
        ip: req.ip,
      });
      return { provider: { ...provider, key: undefined, maskedKey: maskProviderKey(provider.key) } };
    });

    instance.delete("/providers/:id", async (req) => {
      const { id } = req.params as { id: string };
      const provider = await prisma.provider.findUnique({ where: { id }, select: { id: true } });
      if (!provider) throw new AppError("Provider não encontrado", 404, "PROVIDER_NOT_FOUND");
      await prisma.provider.delete({ where: { id } });
      await logAudit({
        userId: req.authUser?.id,
        action: "admin.provider.delete",
        resource: "Provider",
        resourceId: id,
        ip: req.ip,
      });
      return { deleted: true };
    });

    instance.patch<{ Params: { id: string }; Body: { isActive?: boolean; config?: Prisma.InputJsonValue } }>(
      "/providers/:id",
      async (req) => {
        const data: { isActive?: boolean; config?: Prisma.InputJsonValue } = {};
        if (typeof req.body?.isActive === "boolean") data.isActive = req.body.isActive;
        if (req.body?.config !== undefined) data.config = req.body.config;
        if (Object.keys(data).length === 0) {
          throw new AppError("Nenhum campo válido para atualizar", 400, "INVALID_INPUT");
        }
        const provider = await prisma.provider.update({
          where: { id: req.params.id },
          data,
        });
        await logAudit({
          userId: req.authUser?.id,
          action: "admin.provider.update",
          resource: "Provider",
          resourceId: provider.id,
          metadata: { isActive: data.isActive },
          ip: req.ip,
        });
        return { provider: { ...provider, key: undefined, maskedKey: maskProviderKey(provider.key) } };
      },
    );
  });
}