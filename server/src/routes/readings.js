import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const readingsRouter = Router();

// NUEVA RUTA: Para recibir datos del ESP32
readingsRouter.post("/", async (req, res) => {
  try {
    const payload = req.body;
    
    const timestamp = payload.epoch && payload.epoch > 1000000000 
      ? new Date(payload.epoch * 1000) 
      : new Date();

    const records = payload.sensors.map((sensor) => ({
      sensorId: sensor.sensorId,
      rawValue: sensor.rawValue,
      adcVoltage: sensor.adcVoltage,
      sensorVoltage: sensor.sensorVoltage,
      resistance: sensor.resistance,
      resistanceRatio: sensor.resistanceRatio,
      ppm: sensor.ppm,
      gasDetected: sensor.gasDetected,
      sensorTimestamp: timestamp
    }));

    await prisma.reading.createMany({ data: records });
    res.status(201).json({ message: "Lectura guardada en AWS" });
  } catch (error) {
    console.error(`Error guardando lectura: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

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
