import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { startRetentionCleaner } from "./services/retentionCleaner.js";
import { disconnectPrisma } from "./db/prisma.js";

const app = createApp();
const server = app.listen(config.serverPort, () => {
  console.log(`Server listening on http://localhost:${config.serverPort}`);
});

const cleanerHandle = startRetentionCleaner();

const shutdown = async () => {
  clearInterval(cleanerHandle);
  server.close();
  await disconnectPrisma();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
