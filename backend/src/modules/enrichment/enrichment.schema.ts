import { z } from "zod";

export const enrichCompanySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    provider: z.string().optional(),
    fields: z.array(z.enum(["email", "phone", "whatsapp", "website", "social"])).optional(),
  }),
});

export const batchEnrichSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string()).min(1),
    provider: z.string().optional(),
    fields: z.array(z.enum(["email", "phone", "whatsapp", "website", "social"])).optional(),
  }),
});

export type EnrichCompanyInput = z.infer<typeof enrichCompanySchema>["body"];
export type BatchEnrichInput = z.infer<typeof batchEnrichSchema>["body"];
