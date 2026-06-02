#include "config.h"
#include "WiFiConnection.h"
#include "TimeService.h"
#include "MQ2Sensor.h"
#include "ApiServer.h"

WiFiConnection wifiConnection;
TimeService timeService;

MQ2Sensor sensor(1, SENSOR_ONE_ANALOG_PIN, SENSOR_ONE_LED_PIN);
SensorReading sensorReading;

ApiServer apiServer(&sensorReading, &timeService);

unsigned long lastReadingTime = 0;
unsigned long lastTimeSync = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  sensor.begin();

  Serial.println("Warming up sensor");
  delay(WARMUP_DELAY_MS);

  Serial.println("Calibrating base resistance in clean air");
  sensor.calibrate();
  Serial.print("Sensor 1 Ro (kOhm): ");
  Serial.println(sensor.getBaseResistance(), 4);

  wifiConnection.connect();
  timeService.begin();
  timeService.sync();

  sensorReading = sensor.read();

  apiServer.begin();
  Serial.println("HTTP server started");
}

void loop() {
  apiServer.handleClient();

  unsigned long now = millis();

  if (now - lastReadingTime >= READING_INTERVAL_MS) {
    lastReadingTime = now;
    sensorReading = sensor.read();
  }

  if (now - lastTimeSync >= NTP_SYNC_INTERVAL_MS) {
    lastTimeSync = now;
    if (wifiConnection.isConnected()) {
      timeService.sync();
    }
  }
}
