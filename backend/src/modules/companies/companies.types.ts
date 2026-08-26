import { Company } from "@prisma/client";

export interface CompanyWithScore extends Company {
  score: number;
  scoreLabel: string;
}

export interface ListCompaniesResult {
  items: CompanyWithScore[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
