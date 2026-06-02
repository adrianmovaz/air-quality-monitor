import { config } from "../config/env.js";
import { prisma } from "../db/prisma.js";

const cleanupOnce = async () => {
  try {
    const cutoff = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.reading.deleteMany({
      where: { sensorTimestamp: { lt: cutoff } }
    });
    if (result.count > 0) {
      console.log(`Removed ${result.count} readings older than ${config.retentionDays} days`);
    }
  } catch (error) {
    console.error(`Cleanup error: ${error.message}`);
  }
};

export const startRetentionCleaner = () => {
  console.log(`Retention set to ${config.retentionDays} days`);
  cleanupOnce();
  return setInterval(cleanupOnce, config.cleanupIntervalMs);
};
