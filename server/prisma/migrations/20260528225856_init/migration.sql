-- CreateTable
CREATE TABLE "Reading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sensorId" INTEGER NOT NULL,
    "rawValue" REAL NOT NULL,
    "adcVoltage" REAL NOT NULL,
    "sensorVoltage" REAL NOT NULL,
    "resistance" REAL NOT NULL,
    "resistanceRatio" REAL NOT NULL,
    "ppm" REAL NOT NULL,
    "gasDetected" BOOLEAN NOT NULL,
    "sensorTimestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Reading_sensorId_sensorTimestamp_idx" ON "Reading"("sensorId", "sensorTimestamp");

-- CreateIndex
CREATE INDEX "Reading_gasDetected_sensorTimestamp_idx" ON "Reading"("gasDetected", "sensorTimestamp");
