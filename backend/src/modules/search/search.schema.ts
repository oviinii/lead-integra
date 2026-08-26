import { z } from "zod";

export const createSearchSchema = z.object({
  body: z.object({
    keyword: z.string().trim().min(2).max(120),
    country: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    region: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    neighborhood: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(20).optional(),
    radiusKm: z.number().int().min(1).max(500).optional(),
    category: z.string().trim().max(120).optional(),
    quantity: z.number().int().min(1).max(500).default(50),
    filters: z.record(z.unknown()).optional(),
  }),
});

export const listSearchSchema = z.object({
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  }),
});

export type CreateSearchInput = z.infer<typeof createSearchSchema>["body"];
export type ListSearchQuery = z.infer<typeof listSearchSchema>["querystring"];
