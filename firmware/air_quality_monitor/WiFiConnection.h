#ifndef WIFI_CONNECTION_H
#define WIFI_CONNECTION_H

#include <Arduino.h>

class WiFiConnection {
public:
  void connect();
  bool isConnected();
  String getIpAddress();
};

#endif
