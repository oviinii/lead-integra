import { FastifyInstance } from "fastify";
import { authenticate, workspaceResolver } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma";
import { AppError } from "@/shared/errors/AppError";

const phoneCompanyPairSchema = z.object({
  phone: z.string().min(1),
  companyId: z.string(),
});

const checkWhatsAppSchema = z.object({
  body: z.object({
    phone: z.string().min(1),
    companyId: z.string(),
  }),
});

type CheckWhatsAppInput = z.infer<typeof checkWhatsAppSchema>["body"];

const batchCheckWhatsAppSchema = z.object({
  body: z.object({
    phones: z.array(phoneCompanyPairSchema).min(1).max(100),
  }),
});

type BatchCheckWhatsAppInput = z.infer<typeof batchCheckWhatsAppSchema>["body"];

const OPENWA_URL = process.env.OPENWA_URL || "http://localhost:8000";

async function checkWhatsAppViaOpenWA(phone: string): Promise<{ hasWhatsApp: boolean; whatsappNumber?: string }> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const res = await fetch(`${OPENWA_URL}/check-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formattedPhone }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenWA error: ${res.status} - ${text}`);
    }

    const data = await res.json() as Record<string, any>;
    return {
      hasWhatsApp: data.exists === true || data.hasWhatsApp === true,
      whatsappNumber: data.number || data.whatsappNumber,
    };
  } catch (err) {
    throw new AppError(
      `Falha ao verificar WhatsApp: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      502,
      "OPENWA_ERROR",
    );
  }
}

export default async function openwaRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.addHook("preHandler", workspaceResolver({ requiredRole: "MEMBER" }));

    instance.post(
      "/check",
      { preValidation: validate(checkWhatsAppSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        const body = (req as any).body as CheckWhatsAppInput;
        const result = await checkWhatsAppViaOpenWA(body.phone);
        await prisma.company.updateMany({
          where: { id: body.companyId, workspaceId: ctx.workspaceId },
          data: {
            whatsapp: result.hasWhatsApp ? (result.whatsappNumber || body.phone) : null,
            whatsappVerified: true,
          },
        });
        return { phone: body.phone, ...result };
      },
    );

    instance.post(
      "/batch-check",
      { preValidation: validate(batchCheckWhatsAppSchema) },
      async (req) => {
        const ctx = (req as any).workspace;
        const body = (req as any).body as BatchCheckWhatsAppInput;
        const results: Record<string, { hasWhatsApp: boolean; whatsappNumber?: string }> = {};

        for (const { phone, companyId } of body.phones) {
          try {
            const result = await checkWhatsAppViaOpenWA(phone);
            await prisma.company.updateMany({
              where: { id: companyId, workspaceId: ctx.workspaceId },
              data: {
                whatsapp: result.hasWhatsApp ? (result.whatsappNumber || phone) : null,
                whatsappVerified: true,
              },
            });
            results[phone] = result;
          } catch {
            results[phone] = { hasWhatsApp: false };
          }
        }

        return { results };
      },
    );

    instance.get("/status", async () => {
      try {
        const res = await fetch(`${OPENWA_URL}/status`, { signal: AbortSignal.timeout(5000) });
        return { connected: res.ok };
      } catch {
        return { connected: false };
      }
    });
  });
}