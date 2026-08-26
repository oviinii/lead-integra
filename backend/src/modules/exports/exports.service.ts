import { prisma } from "@/shared/database/prisma";

const FIELDS = [
  "empresa",
  "categoria",
  "telefone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "facebook",
  "endereco",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "rating",
  "review_count",
  "score",
  "status",
  "tags",
  "criado_em",
] as const;

// Lightweight CSV builder (RFC 4180)
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCSV(rows: Array<Record<string, unknown>>): string {
  const header = FIELDS.join(",");
  const body = rows
    .map((r) => FIELDS.map((f) => csvEscape(r[f])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export async function exportLeads(workspaceId: string, listId?: string): Promise<string> {
  const where = listId
    ? { workspaceId, lists: { some: { listId } } }
    : { workspaceId };

  const leads = await prisma.lead.findMany({
    where,
    include: {
      company: true,
      tags: { include: { tag: true } },
      lists: { include: { list: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = leads.map((l) => ({
    empresa: l.company.name,
    categoria: l.company.category,
    telefone: l.company.phone,
    whatsapp: l.company.whatsapp,
    email: l.company.email,
    website: l.company.website,
    instagram: l.company.instagram,
    facebook: l.company.facebook,
    endereco: l.company.address,
    bairro: l.company.neighborhood,
    cidade: l.company.city,
    estado: l.company.state,
    cep: l.company.postalCode,
    rating: l.company.rating,
    review_count: l.company.reviewCount,
    score: l.score,
    status: l.status,
    tags: l.tags.map((t) => t.tag.name).join("|"),
    criado_em: l.createdAt.toISOString(),
  }));

  return buildCSV(rows);
}

export async function exportCompanies(workspaceId: string): Promise<string> {
  const companies = await prisma.company.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const rows = companies.map((c) => ({
    empresa: c.name,
    categoria: c.category,
    telefone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    website: c.website,
    instagram: c.instagram,
    facebook: c.facebook,
    endereco: c.address,
    bairro: c.neighborhood,
    cidade: c.city,
    estado: c.state,
    cep: c.postalCode,
    rating: c.rating,
    review_count: c.reviewCount,
    score: null,
    status: null,
    tags: null,
    criado_em: c.createdAt.toISOString(),
  }));
  return buildCSV(rows);
}

export function csvFilename(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.csv`;
}
