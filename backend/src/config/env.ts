import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3001),
  HOST: process.env.HOST || "0.0.0.0",
  API_URL: process.env.API_URL || "http://localhost:3001",
  APP_URL: process.env.APP_URL || "http://localhost:5173",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me-in-production-32chars",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me-32chars",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  COMPANY_PROVIDER_API_KEY: process.env.COMPANY_PROVIDER_API_KEY || "",
  COMPANY_PROVIDER_BASE_URL: process.env.COMPANY_PROVIDER_BASE_URL || "",

  SERPRO_TOKEN: process.env.SERPRO_TOKEN || "",
  SERPRO_BASE_URL: process.env.SERPRO_BASE_URL || "https://gateway.apiserpro.serpro.com.br",
  RECEITAWS_TOKEN: process.env.RECEITAWS_TOKEN || "",

  MAP_PROVIDER_API_KEY: process.env.MAP_PROVIDER_API_KEY || "",
  MAP_PROVIDER: process.env.MAP_PROVIDER || "openstreetmap",

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@lead.local",

  CREDENTIALS_ENCRYPTION_KEY: process.env.CREDENTIALS_ENCRYPTION_KEY || "",
  DEFAULT_EMAIL_DAILY_LIMIT: Number(process.env.DEFAULT_EMAIL_DAILY_LIMIT || 500),

  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SENTRY_DSN: process.env.SENTRY_DSN || "",

  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || "1 minute",

  PLANS: {
    FREE: Number(process.env.APP_PLAN_FREE_CREDITS || 100),
    STARTER: Number(process.env.APP_PLAN_STARTER_CREDITS || 1000),
    PRO: Number(process.env.APP_PLAN_PRO_CREDITS || 5000),
    ENTERPRISE: Number(process.env.APP_PLAN_ENTERPRISE_CREDITS || 50000),
  },
} as const;

export type Env = typeof env;
