import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    logoUrl: z.string().url().optional().nullable(),
  }),
  params: z.object({ id: z.string() }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
  }),
  params: z.object({ id: z.string() }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
  }),
  params: z.object({ id: z.string(), memberId: z.string() }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>["body"];
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>["body"];
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>["body"];
