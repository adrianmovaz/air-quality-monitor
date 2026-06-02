#ifndef MQ2_SENSOR_H
#define MQ2_SENSOR_H

#include <Arduino.h>

struct SensorReading {
  int sensorId;
  float rawValue;
  float adcVoltage;
  float sensorVoltage;
  float resistance;
  float resistanceRatio;
  float ppm;
  bool gasDetected;
};

class MQ2Sensor {
public:
  MQ2Sensor(int sensorId, int analogPin, int ledPin);
  void begin();
  void calibrate();
  SensorReading read();
  float getBaseResistance() const;

private:
  int _sensorId;
  int _analogPin;
  int _ledPin;
  float _baseResistance;

  float readAverageRaw(int samples);
  float rawToAdcVoltage(float raw);
  float adcVoltageToSensorVoltage(float adcVoltage);
  float computeResistance(float sensorVoltage);
  float computePpm(float ratio);
};

#endif
