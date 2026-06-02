import { config } from "../config/env.js";
import { prisma } from "../db/prisma.js";

const resolveTimestamp = (epoch) => {
  if (typeof epoch === "number" && epoch > 1000000000) {
    return new Date(epoch * 1000);
  }
  return new Date();
};

const persistReadings = async (payload) => {
  const timestamp = resolveTimestamp(payload.epoch);
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
};

const pollOnce = async () => {
  try {
    const response = await fetch(`${config.esp32Host}/api/readings`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) {
      console.error(`Poll failed with status ${response.status}`);
      return;
    }
    const payload = await response.json();
    if (!payload.sensors || payload.sensors.length === 0) {
      return;
    }
    await persistReadings(payload);
  } catch (error) {
    console.error(`Poll error: ${error.message}`);
  }
};

export const startDevicePoller = () => {
  console.log(`Polling ${config.esp32Host} every ${config.pollIntervalMs} ms`);
  pollOnce();
  return setInterval(pollOnce, config.pollIntervalMs);
};
