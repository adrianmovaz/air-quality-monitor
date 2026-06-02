import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { startDevicePoller } from "./services/devicePoller.js";
import { startRetentionCleaner } from "./services/retentionCleaner.js";
import { disconnectPrisma } from "./db/prisma.js";

const app = createApp();
const server = app.listen(config.serverPort, () => {
  console.log(`Server listening on http://localhost:${config.serverPort}`);
});

const pollerHandle = startDevicePoller();
const cleanerHandle = startRetentionCleaner();

const shutdown = async () => {
  clearInterval(pollerHandle);
  clearInterval(cleanerHandle);
  server.close();
  await disconnectPrisma();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
