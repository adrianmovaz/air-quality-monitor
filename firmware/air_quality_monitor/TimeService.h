#ifndef TIME_SERVICE_H
#define TIME_SERVICE_H

#include <Arduino.h>

class TimeService {
public:
  void begin();
  void sync();
  bool isSynced();
  unsigned long getEpochSeconds();
  String getIsoTimestamp();

private:
  bool _synced = false;
};

#endif
