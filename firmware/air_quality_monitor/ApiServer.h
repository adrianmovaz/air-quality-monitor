#ifndef API_SERVER_H
#define API_SERVER_H

#include <Arduino.h>
#include <WebServer.h>
#include "MQ2Sensor.h"
#include "TimeService.h"

class ApiServer {
public:
  ApiServer(SensorReading *sensor, TimeService *timeService);
  void begin();
  void handleClient();

private:
  WebServer _server;
  SensorReading *_sensor;
  TimeService *_timeService;

  void handleRoot();
  void handleReadings();
  String buildSensorJson(SensorReading *reading);
  String buildReadingsJson();
  String buildLivePage();
};

#endif
