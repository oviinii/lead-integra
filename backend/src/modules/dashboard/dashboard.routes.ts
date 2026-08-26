import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { prisma } from "@/shared/database/prisma";

export default async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver());

    instance.get("/", async (req) => {
      const ctx = (req as any).workspace;
      const ws = ctx.workspaceId;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalCompanies,
        totalLeads,
        leadsThisMonth,
        totalSearches,
        leadsWithPhone,
        leadsWithWhatsapp,
        leadsWithEmail,
        leadsWithWebsite,
        balance,
        exportsCount,
      ] = await Promise.all([
        prisma.company.count({ where: { workspaceId: ws } }),
        prisma.lead.count({ where: { workspaceId: ws } }),
        prisma.lead.count({ where: { workspaceId: ws, createdAt: { gte: startOfMonth } } }),
        prisma.search.count({ where: { workspaceId: ws } }),
        prisma.company.count({ where: { workspaceId: ws, phone: { not: null } } }),
        prisma.company.count({ where: { workspaceId: ws, whatsapp: { not: null } } }),
        prisma.company.count({ where: { workspaceId: ws, email: { not: null } } }),
        prisma.company.count({ where: { workspaceId: ws, website: { not: null } } }),
        prisma.creditBalance.findUnique({ where: { workspaceId: ws } }),
        prisma.export.count({ where: { workspaceId: ws } }),
      ]);

      return {
        companies: { total: totalCompanies },
        leads: { total: totalLeads, thisMonth: leadsThisMonth },
        searches: { total: totalSearches },
        quality: {
          phone: totalCompanies ? leadsWithPhone / totalCompanies : 0,
          whatsapp: totalCompanies ? leadsWithWhatsapp / totalCompanies : 0,
          email: totalCompanies ? leadsWithEmail / totalCompanies : 0,
          website: totalCompanies ? leadsWithWebsite / totalCompanies : 0,
        },
        credits: {
          balance: balance?.balance ?? 0,
          lifetime: balance?.lifetime ?? 0,
        },
        exports: { total: exportsCount },
      };
    });
  });
}
