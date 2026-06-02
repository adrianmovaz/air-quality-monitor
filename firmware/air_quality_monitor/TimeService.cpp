#include "TimeService.h"
#include "config.h"
#include <time.h>

void TimeService::begin() {
  configTime(0, 0, NTP_SERVER);
  setenv("TZ", TIMEZONE, 1);
  tzset();
}

void TimeService::sync() {
  struct tm timeInfo;
  if (getLocalTime(&timeInfo, 10000)) {
    _synced = true;
  } else {
    _synced = false;
  }
}

bool TimeService::isSynced() {
  return _synced;
}

unsigned long TimeService::getEpochSeconds() {
  time_t now;
  time(&now);
  return (unsigned long)now;
}

String TimeService::getIsoTimestamp() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 1000)) {
    return String("1970-01-01T00:00:00");
  }
  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeInfo);
  return String(buffer);
}
