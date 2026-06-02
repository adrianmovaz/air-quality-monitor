#include "MQ2Sensor.h"
#include "config.h"

MQ2Sensor::MQ2Sensor(int sensorId, int analogPin, int ledPin) {
  _sensorId = sensorId;
  _analogPin = analogPin;
  _ledPin = ledPin;
  _baseResistance = 0.0f;
}

void MQ2Sensor::begin() {
  pinMode(_ledPin, OUTPUT);
  digitalWrite(_ledPin, LOW);
  analogReadResolution(12);
  analogSetPinAttenuation(_analogPin, ADC_11db);
}

float MQ2Sensor::readAverageRaw(int samples) {
  long total = 0;
  for (int i = 0; i < samples; i++) {
    total += analogRead(_analogPin);
    delay(5);
  }
  return (float)total / samples;
}

float MQ2Sensor::rawToAdcVoltage(float raw) {
  return (raw / ADC_MAX_VALUE) * ADC_REFERENCE_VOLTAGE;
}

float MQ2Sensor::adcVoltageToSensorVoltage(float adcVoltage) {
  return adcVoltage / DIVIDER_RATIO;
}

float MQ2Sensor::computeResistance(float sensorVoltage) {
  if (sensorVoltage <= 0.01f) {
    return -1.0f;
  }
  return (SENSOR_SUPPLY_VOLTAGE / sensorVoltage - 1.0f) * LOAD_RESISTANCE_KOHM;
}

float MQ2Sensor::computePpm(float ratio) {
  if (ratio <= 0.0f) {
    return 0.0f;
  }
  return PPM_CURVE_A * pow(ratio, PPM_CURVE_B);
}

void MQ2Sensor::calibrate() {
  float raw = readAverageRaw(CALIBRATION_SAMPLES);
  float adcVoltage = rawToAdcVoltage(raw);
  float sensorVoltage = adcVoltageToSensorVoltage(adcVoltage);
  float resistance = computeResistance(sensorVoltage);
  _baseResistance = resistance / CLEAN_AIR_RATIO;
}

float MQ2Sensor::getBaseResistance() const {
  return _baseResistance;
}

SensorReading MQ2Sensor::read() {
  SensorReading result;
  result.sensorId = _sensorId;
  result.rawValue = readAverageRaw(SAMPLES_PER_READING);
  result.adcVoltage = rawToAdcVoltage(result.rawValue);
  result.sensorVoltage = adcVoltageToSensorVoltage(result.adcVoltage);
  result.resistance = computeResistance(result.sensorVoltage);

  if (_baseResistance > 0.0f && result.resistance > 0.0f) {
    result.resistanceRatio = result.resistance / _baseResistance;
  } else {
    result.resistanceRatio = 0.0f;
  }

  result.ppm = computePpm(result.resistanceRatio);
  result.gasDetected = result.ppm >= PPM_ALERT_THRESHOLD;

  digitalWrite(_ledPin, result.gasDetected ? HIGH : LOW);
  return result;
}
