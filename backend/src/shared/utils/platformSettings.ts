import { env } from "@/config/env";
import { prisma } from "@/shared/database/prisma";

export interface PlatformConfig {
  platformName: string;
  baseUrl: string;
  maintenanceMode: boolean;
  require2FA: boolean;
  sessionTimeout: number;
  freeCredits: number;
  welcomeBonus: number;
  searchCost: number;
  enrichmentCost: number;
  sendWelcomeEmail: boolean;
  lowCreditAlerts: boolean;
  weeklyReports: boolean;
  defaultTheme: string;
  primaryColor: string;
}

const DEFAULTS: PlatformConfig = {
  platformName: "Lead Generator",
  baseUrl: env.APP_URL,
  maintenanceMode: false,
  require2FA: false,
  sessionTimeout: 24,
  freeCredits: env.PLANS.FREE,
  welcomeBonus: 0,
  searchCost: 1,
  enrichmentCost: 1,
  sendWelcomeEmail: true,
  lowCreditAlerts: true,
  weeklyReports: false,
  defaultTheme: "system",
  primaryColor: "#2563eb",
};

const BOOLEAN_KEYS = new Set([
  "maintenanceMode",
  "require2FA",
  "sendWelcomeEmail",
  "lowCreditAlerts",
  "weeklyReports",
]);

const NUMBER_KEYS = new Set([
  "sessionTimeout",
  "freeCredits",
  "welcomeBonus",
  "searchCost",
  "enrichmentCost",
]);

export const PLATFORM_CONFIG_KEYS = Object.keys(DEFAULTS);

function parseStoredValue(key: string, raw: string): string | number | boolean {
  if (BOOLEAN_KEYS.has(key)) return raw === "true";
  if (NUMBER_KEYS.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : (DEFAULTS as unknown as Record<string, string | number | boolean>)[key];
  }
  return raw;
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const stored = await prisma.platformSetting.findMany();
  const overrides: Record<string, string | number | boolean> = {};
  for (const row of stored) {
    if (PLATFORM_CONFIG_KEYS.includes(row.key)) {
      overrides[row.key] = parseStoredValue(row.key, row.value);
    }
  }
  return { ...DEFAULTS, ...overrides };
}

export async function setPlatformConfigValue(key: string, value: string | number | boolean): Promise<void> {
  if (!PLATFORM_CONFIG_KEYS.includes(key)) {
    throw new Error(`Unknown platform config key: ${key}`);
  }
  await prisma.platformSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

export async function isMaintenanceMode(): Promise<boolean> {
  const row = await prisma.platformSetting.findUnique({ where: { key: "maintenanceMode" } });
  if (!row) return false;
  return row.value === "true";
}
