import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { ZodError } from "zod";
import { env } from "@/config/env";
import { AppError } from "@/shared/errors/AppError";
import authRoutes from "@/modules/auth/auth.routes";
import workspaceRoutes from "@/modules/workspaces/workspaces.routes";
import companiesRoutes from "@/modules/companies/companies.routes";
import searchRoutes from "@/modules/search/search.routes";
import leadsRoutes from "@/modules/leads/leads.routes";
import tagsRoutes from "@/modules/tags/tags.routes";
import listsRoutes from "@/modules/lists/lists.routes";
import exportsRoutes from "@/modules/exports/exports.routes";
import creditsRoutes from "@/modules/credits/credits.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import adminRoutes from "@/modules/admin/admin.routes";
import notificationsRoutes from "@/modules/notifications/notifications.routes";
import locationsRoutes from "@/modules/locations/locations.routes";
import enrichmentRoutes from "@/modules/enrichment/enrichment.routes";
import openwaRoutes from "@/modules/openwa/openwa.routes";
import emailCampaignsRoutes from "@/modules/email-campaigns/email-campaigns.routes";
import smtpCredentialsRoutes from "@/modules/smtp-credentials/smtp-credentials.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
          : undefined,
    },
    bodyLimit: 10 * 1024 * 1024,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  await app.register(sensible);

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.errors,
      });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        error: error.code ?? "CLIENT_ERROR",
        message: error.message,
      });
    }
    request.log.error({ err: error }, "unhandled error");
    return reply.code(500).send({
      error: "INTERNAL_ERROR",
      message: env.NODE_ENV === "production" ? "Internal server error" : error.message,
    });
  });

  app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));

  await app.register(async (api) => {
    await api.register(authRoutes, { prefix: "/auth" });
    await api.register(workspaceRoutes, { prefix: "/workspaces" });
    await api.register(companiesRoutes, { prefix: "/companies" });
    await api.register(searchRoutes, { prefix: "/search" });
    await api.register(leadsRoutes, { prefix: "/leads" });
    await api.register(tagsRoutes, { prefix: "/tags" });
    await api.register(listsRoutes, { prefix: "/lists" });
    await api.register(exportsRoutes, { prefix: "/exports" });
    await api.register(creditsRoutes, { prefix: "/credits" });
    await api.register(dashboardRoutes, { prefix: "/dashboard" });
    await api.register(adminRoutes, { prefix: "/admin" });
    await api.register(notificationsRoutes, { prefix: "/notifications" });
    await api.register(locationsRoutes, { prefix: "/locations" });
    await api.register(enrichmentRoutes, { prefix: "/enrichment" });
    await api.register(openwaRoutes, { prefix: "/openwa" });
    await api.register(emailCampaignsRoutes, { prefix: "/email-campaigns" });
    await api.register(smtpCredentialsRoutes, { prefix: "/smtp-credentials" });
  }, { prefix: "/api" });

  return app;
}
