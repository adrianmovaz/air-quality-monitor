const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  serverPort: toInt(process.env.SERVER_PORT, 4000),
  esp32Host: process.env.ESP32_HOST || "http://esp32-airquality.local",
  pollIntervalMs: toInt(process.env.POLL_INTERVAL_MS, 5000),
  retentionDays: toInt(process.env.RETENTION_DAYS, 14),
  cleanupIntervalMs: toInt(process.env.CLEANUP_INTERVAL_MS, 3600000)
};
