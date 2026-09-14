import { z } from "zod";

const credentialBody = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  host: z.string().trim().min(3, "Servidor SMTP é obrigatório").max(255),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  username: z.string().trim().min(3, "Usuário é obrigatório").max(255),
  password: z.string().min(1, "Senha é obrigatória").max(500),
  fromAddress: z.string().trim().email("E-mail de remetente inválido"),
  dailyLimit: z.coerce.number().int().min(1).max(100000).default(500),
  isDefault: z.boolean().optional(),
});

export const createSmtpCredentialSchema = z.object({
  body: credentialBody,
});

export const updateSmtpCredentialSchema = z.object({
  body: credentialBody.partial(),
});

export const listSmtpCredentialsSchema = z.object({
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const testSmtpSchema = z.object({
  body: z.object({
    host: z.string().trim().min(3).max(255).default("smtp.gmail.com"),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    username: z.string().trim().min(3).max(255),
    password: z.string().min(1).max(500),
    fromAddress: z.string().trim().email().optional(),
  }),
});

export type TestSmtpInput = z.infer<typeof testSmtpSchema>["body"];

export type CreateSmtpCredentialInput = z.infer<typeof createSmtpCredentialSchema>["body"];
export type UpdateSmtpCredentialInput = z.infer<typeof updateSmtpCredentialSchema>["body"];
export type ListSmtpCredentialsQuery = z.infer<typeof listSmtpCredentialsSchema>["querystring"];
