import { z } from "zod";

export const exportLeadsSchema = z.object({
  body: z.object({
    type: z.enum(["leads", "companies", "list"]).default("leads"),
    listId: z.string().optional(),
    filters: z.record(z.unknown()).optional(),
  }),
});

export type ExportInput = z.infer<typeof exportLeadsSchema>["body"];
