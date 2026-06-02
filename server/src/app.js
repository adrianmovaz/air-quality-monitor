import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readingsRouter } from "./routes/readings.js";
import { eventsRouter } from "./routes/events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/readings", readingsRouter);
  app.use("/api/events", eventsRouter);
  app.use(express.static(path.join(__dirname, "..", "public")));
  return app;
};
