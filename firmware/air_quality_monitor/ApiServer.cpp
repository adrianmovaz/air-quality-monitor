#include "ApiServer.h"
#include "config.h"

ApiServer::ApiServer(SensorReading *sensor, TimeService *timeService)
    : _server(HTTP_SERVER_PORT) {
  _sensor = sensor;
  _timeService = timeService;
}

void ApiServer::begin() {
  _server.on("/", HTTP_GET, [this]() { handleRoot(); });
  _server.on("/api/readings", HTTP_GET, [this]() { handleReadings(); });
  _server.begin();
}

void ApiServer::handleClient() {
  _server.handleClient();
}

String ApiServer::buildSensorJson(SensorReading *reading) {
  String json = "{";
  json += "\"sensorId\":" + String(reading->sensorId) + ",";
  json += "\"rawValue\":" + String(reading->rawValue, 0) + ",";
  json += "\"adcVoltage\":" + String(reading->adcVoltage, 4) + ",";
  json += "\"sensorVoltage\":" + String(reading->sensorVoltage, 4) + ",";
  json += "\"resistance\":" + String(reading->resistance, 4) + ",";
  json += "\"resistanceRatio\":" + String(reading->resistanceRatio, 4) + ",";
  json += "\"ppm\":" + String(reading->ppm, 2) + ",";
  json += "\"gasDetected\":" + String(reading->gasDetected ? "true" : "false");
  json += "}";
  return json;
}

String ApiServer::buildReadingsJson() {
  String json = "{";
  json += "\"epoch\":" + String(_timeService->getEpochSeconds()) + ",";
  json += "\"timestamp\":\"" + _timeService->getIsoTimestamp() + "\",";
  json += "\"timeSynced\":" + String(_timeService->isSynced() ? "true" : "false") + ",";
  json += "\"sensors\":[" + buildSensorJson(_sensor) + "]";
  json += "}";
  return json;
}

void ApiServer::handleReadings() {
  _server.sendHeader("Access-Control-Allow-Origin", "*");
  _server.send(200, "application/json", buildReadingsJson());
}

String ApiServer::buildLivePage() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='3'>";
  html += "<title>ESP32 Air Quality</title>";
  html += "<style>body{font-family:monospace;background:#0d1117;color:#e6edf3;margin:0;padding:24px}";
  html += "h1{font-size:16px;color:#58a6ff}.card{border:1px solid #30363d;border-radius:8px;padding:16px;margin:12px 0}";
  html += ".row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #21262d}";
  html += ".alert{color:#f85149}.ok{color:#3fb950}</style></head><body>";
  html += "<h1>ESP32 AIR QUALITY MONITOR</h1>";
  html += "<p>" + _timeService->getIsoTimestamp() + "</p>";
  html += "<div class='card'><h1>SENSOR " + String(_sensor->sensorId) + "</h1>";
  html += "<div class='row'><span>PPM</span><span>" + String(_sensor->ppm, 2) + "</span></div>";
  html += "<div class='row'><span>Rs/Ro</span><span>" + String(_sensor->resistanceRatio, 3) + "</span></div>";
  html += "<div class='row'><span>Rs (kOhm)</span><span>" + String(_sensor->resistance, 3) + "</span></div>";
  html += "<div class='row'><span>Sensor Voltage</span><span>" + String(_sensor->sensorVoltage, 3) + " V</span></div>";
  html += "<div class='row'><span>Raw ADC</span><span>" + String(_sensor->rawValue, 0) + "</span></div>";
  html += "<div class='row'><span>Status</span><span class='" + String(_sensor->gasDetected ? "alert" : "ok");
  html += "'>" + String(_sensor->gasDetected ? "GAS DETECTED" : "CLEAR") + "</span></div>";
  html += "</div></body></html>";
  return html;
}

void ApiServer::handleRoot() {
  _server.send(200, "text/html", buildLivePage());
}
