import type { Company } from "@prisma/client";

interface ScoreInput {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  isActive?: boolean;
}

export type ScoreLabel = "Baixo" | "Médio" | "Bom" | "Excelente";

export interface ScoreResult {
  score: number;
  label: ScoreLabel;
}

export function calculateLeadScore(input: ScoreInput): ScoreResult {
  let score = 0;
  if (input.website) score += 10;
  if (input.phone) score += 10;
  if (input.whatsapp) score += 15;
  if (input.email) score += 20;
  if (input.instagram) score += 5;
  if (input.facebook) score += 5;
  if (input.rating && input.rating > 4) score += 10;
  if (input.reviewCount && input.reviewCount > 100) score += 10;
  if (input.isActive) score += 10;
  if (score > 100) score = 100;
  let label: ScoreLabel = "Baixo";
  if (score >= 85) label = "Excelente";
  else if (score >= 70) label = "Bom";
  else if (score >= 40) label = "Médio";
  return { score, label };
}

export function scoreCompany(company: Pick<Company, "phone" | "whatsapp" | "email" | "website" | "instagram" | "facebook" | "rating" | "reviewCount" | "isActive">): ScoreResult {
  return calculateLeadScore(company);
}
