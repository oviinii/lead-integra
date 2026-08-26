import { buildApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./shared/database/prisma";

async function main() {
  await connectDatabase();
  const app = await buildApp();
  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info(`API listening on ${env.HOST}:${env.PORT}`);

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
