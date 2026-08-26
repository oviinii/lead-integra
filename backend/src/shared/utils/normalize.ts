export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const last9 = digits.slice(-9);
  const last8 = digits.slice(-8);
  if (digits.length >= 10 && digits.startsWith("55")) {
    return `+${digits}`;
  }
  if (last9.length === 9) {
    return last9;
  }
  return last8 || digits;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

export function normalizeDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    let u = url.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    const parsed = new URL(u);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
): string {
  const a = (address || "").toLowerCase().replace(/\s+/g, " ").trim();
  const c = (city || "").toLowerCase().trim();
  const s = (state || "").toLowerCase().trim();
  return [a, c, s].filter(Boolean).join("|");
}

export function isWhatsApp(phone: string | null | undefined): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const last9 = normalized.replace(/\D/g, "").slice(-9);
  return last9.length === 9;
}
