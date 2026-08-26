import { z } from "zod";

export const createLeadSchema = z.object({
  body: z.object({
    companyId: z.string().min(1),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "ARCHIVED"]).default("NEW"),
    notes: z.string().max(5000).optional(),
    assigneeId: z.string().optional(),
    listIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
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
