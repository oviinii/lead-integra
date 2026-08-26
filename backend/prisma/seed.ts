import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database (sem dados fictícios)...");

  // Plans
  const plans = [
    {
      slug: "FREE" as const,
      name: "Free",
      description: "Plano gratuito para começar",
      priceCents: 0,
      creditsMonthly: 100,
      maxUsers: 1,
      maxSearches: 20,
      maxExports: 5,
      hasApi: false,
    },
    {
      slug: "STARTER" as const,
      name: "Starter",
      description: "Para times pequenos",
      priceCents: 4900,
      creditsMonthly: 1000,
      maxUsers: 3,
      maxSearches: 200,
      maxExports: 50,
      hasApi: false,
    },
    {
      slug: "PRO" as const,
      name: "Pro",
      description: "Para times em crescimento",
      priceCents: 14900,
      creditsMonthly: 5000,
      maxUsers: 10,
      maxSearches: 1000,
      maxExports: 200,
      hasApi: true,
    },
    {
      slug: "ENTERPRISE" as const,
      name: "Enterprise",
      description: "Para grandes operações",
      priceCents: 49900,
      creditsMonthly: 50000,
      maxUsers: 100,
      maxSearches: 10000,
      maxExports: 5000,
      hasApi: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
  }

  // Providers (configured via .env; inactive by default in seed)
  await prisma.provider.upsert({
    where: { key: "primary" },
    create: {
      key: "primary",
      name: "Primary Provider",
      type: "search",
      isActive: false, // set active only when COMPANY_PROVIDER_API_KEY is configured
      config: { requires: "COMPANY_PROVIDER_API_KEY + COMPANY_PROVIDER_BASE_URL" },
    },
    update: {},
  });

  // Super Admin
  const adminEmail = "admin@lead.local";
  const adminPassword = "Admin@123";
  const adminHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash: adminHash,
      isSuperAdmin: true,
      emailVerifiedAt: new Date(),
    },
    update: { isSuperAdmin: true },
  });

  // Demo user
  const demoEmail = "demo@lead.local";
  const demoPassword = "Demo@1234";
  const demoHash = await argon2.hash(demoPassword, { type: argon2.argon2id });

  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      name: "Demo User",
      email: demoEmail,
      passwordHash: demoHash,
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  // Demo workspace
  const slug = "agencia-demo";
  const workspace = await prisma.workspace.upsert({
    where: { slug },
    create: {
      name: "Agência Demo",
      slug,
      ownerId: demo.id,
      plan: "PRO",
      members: {
        create: [
          { userId: demo.id, role: "OWNER" },
          { userId: admin.id, role: "ADMIN" },
        ],
      },
      creditBalance: { create: { balance: 5000, lifetime: 5000 } },
      creditTransactions: {
        create: [
          { type: "BONUS", amount: 5000, description: "Plano PRO - bônus inicial" },
        ],
      },
    },
    update: { plan: "PRO" },
  });

  // Tags iniciais (estrutura vazia para uso, sem leads/tags fictícios)
  const tagNames = [
    { name: "Quente", color: "#ef4444" },
    { name: "WhatsApp", color: "#22c55e" },
    { name: "Prioridade", color: "#f59e0b" },
  ];
  for (const t of tagNames) {
    await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: t.name } },
      create: { ...t, workspaceId: workspace.id },
      update: { color: t.color },
    });
  }

  console.log("Seed complete (sem dados fictícios).");
  console.log(`Super Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Demo User:   ${demoEmail} / ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
