import { z } from "zod";

const manualCompanySchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  document: z.string().trim().max(30).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
});

export const createLeadSchema = z.object({
  body: z
    .object({
      companyId: z.string().min(1).optional(),
      company: manualCompanySchema.optional(),
      status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "ARCHIVED"]).default("NEW"),
      notes: z.string().max(5000).optional(),
      assigneeId: z.string().optional(),
      listIds: z.array(z.string()).optional(),
      tagIds: z.array(z.string()).optional(),
    })
    .refine((data) => data.companyId || data.company, {
      message: "Informe companyId ou os dados da empresa (company)",
      path: ["companyId"],
    }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "ARCHIVED"]).optional(),
    notes: z.string().max(5000).optional(),
    assigneeId: z.string().nullable().optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const listLeadsSchema = z.object({
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(20),
    q: z.string().optional(),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "ARCHIVED"]).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    listId: z.string().optional(),
    tagId: z.string().optional(),
    sortBy: z.enum(["createdAt", "score", "name"]).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>["body"];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>["body"];
export type ListLeadsQuery = z.infer<typeof listLeadsSchema>["querystring"];
