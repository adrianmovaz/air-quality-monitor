import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const readingsRouter = Router();

readingsRouter.get("/latest", async (req, res) => {
  try {
    const sensorIds = [1];
    const latest = await Promise.all(
      sensorIds.map((sensorId) =>
        prisma.reading.findFirst({
          where: { sensorId },
          orderBy: { sensorTimestamp: "desc" }
        })
      )
    );
    res.json(latest.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

readingsRouter.get("/", async (req, res) => {
  try {
    const sensorId = req.query.sensorId ? parseInt(req.query.sensorId, 10) : undefined;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 5000) : 500;
    const from = req.query.from ? new Date(req.query.from) : undefined;
    const to = req.query.to ? new Date(req.query.to) : undefined;

    const where = {};
    if (sensorId) {
      where.sensorId = sensorId;
    }
    if (from || to) {
      where.sensorTimestamp = {};
      if (from) {
        where.sensorTimestamp.gte = from;
      }
      if (to) {
        where.sensorTimestamp.lte = to;
      }
    }

    const readings = await prisma.reading.findMany({
      where,
      orderBy: { sensorTimestamp: "asc" },
      take: limit
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

readingsRouter.get("/stats", async (req, res) => {
  try {
    const sinceHours = req.query.hours ? parseInt(req.query.hours, 10) : 24;
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const sensorIds = [1];

    const stats = await Promise.all(
      sensorIds.map(async (sensorId) => {
        const aggregate = await prisma.reading.aggregate({
          where: { sensorId, sensorTimestamp: { gte: since } },
          _avg: { ppm: true },
          _max: { ppm: true },
          _min: { ppm: true },
          _count: { _all: true }
        });
        const detections = await prisma.reading.count({
          where: { sensorId, gasDetected: true, sensorTimestamp: { gte: since } }
        });
        return {
          sensorId,
          averagePpm: aggregate._avg.ppm,
          maxPpm: aggregate._max.ppm,
          minPpm: aggregate._min.ppm,
          sampleCount: aggregate._count._all,
          detectionCount: detections
        };
      })
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
