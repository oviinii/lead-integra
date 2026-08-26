import { connectDatabase, disconnectDatabase } from "./shared/database/prisma";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  console.log(`Worker connected to database. Queue system will be wired in Phase 2. NODE_ENV=${env.NODE_ENV}`);
  // Keep alive. Phase 2 will register BullMQ processors here.
  setInterval(() => undefined, 1 << 30);
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});
