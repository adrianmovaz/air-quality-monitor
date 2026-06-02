import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 1000) : 100;
    const sensorId = req.query.sensorId ? parseInt(req.query.sensorId, 10) : undefined;

    const where = { gasDetected: true };
    if (sensorId) {
      where.sensorId = sensorId;
    }

    const events = await prisma.reading.findMany({
      where,
      orderBy: { sensorTimestamp: "desc" },
      take: limit
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
