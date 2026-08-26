import { z } from "zod";

export const listCompaniesSchema = z.object({
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(20),
    q: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    hasPhone: z.coerce.boolean().optional(),
    hasWhatsapp: z.coerce.boolean().optional(),
    hasEmail: z.coerce.boolean().optional(),
    hasWebsite: z.coerce.boolean().optional(),
    sortBy: z.enum(["name", "city", "score", "rating", "createdAt"]).default("name"),
    sortDir: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export type ListCompaniesQuery = z.infer<typeof listCompaniesSchema>["querystring"];

export const updateCompanySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    document: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    whatsapp: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    website: z.string().url().nullable().optional(),
    instagram: z.string().nullable().optional(),
    facebook: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
  }),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>["body"];
