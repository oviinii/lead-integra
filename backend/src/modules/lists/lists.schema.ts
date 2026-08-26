import { z } from "zod";

export const createListSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

export const updateListSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const addLeadToListSchema = z.object({
  body: z.object({ leadIds: z.array(z.string()).min(1) }),
  params: z.object({ id: z.string() }),
});

export type CreateListInput = z.infer<typeof createListSchema>["body"];
