import { randomBytes } from "node:crypto";

/** Mask a secret keeping only the last 4 chars visible: "sk-****-****-****-abcd" */
export function maskProviderKey(key: string | null | undefined): string {
  if (!key) return "—";
  const visible = key.slice(-4);
  const prefix = key.includes("-") ? key.split("-")[0] + "-" : "";
  return `${prefix}****-****-****-${visible}`;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
}): PaginationParams {
  const rawPage = Number(query.page);
  const rawSize = Number(query.pageSize);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawSize) && rawSize >= 1 ? Math.min(Math.floor(rawSize), 100) : 20;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** Slugify a workspace name the same way auth.register does */
export function slugifyWorkspace(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base}-${randomBytes(2).toString("hex")}`;
}

/** Temporary password for admin-created users: 12 readable chars */
export function generateTempPassword(): string {
  return randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "x").slice(0, 12);
}

/** Bucket raw timestamps into a zero-filled daily series (oldest → newest) */
export function bucketizeDaily(dates: Date[], days: number, now = new Date()): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = d.toISOString().split("T")[0];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const series: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().split("T")[0];
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return series;
}
