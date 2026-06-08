#include "WiFiConnection.h"
#include "config.h"
#include <WiFi.h>
#include <ESPmDNS.h>

void WiFiConnection::connect() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_HOSTNAME);

  if (strlen(WIFI_PASSWORD) == 0) {
    WiFi.begin(WIFI_SSID);
  } else {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
    WiFi.setSleep(WIFI_PS_MIN_MODEM);
    if (MDNS.begin(DEVICE_HOSTNAME)) {
      MDNS.addService("http", "tcp", HTTP_SERVER_PORT);
      Serial.print("mDNS active: http://");
      Serial.print(DEVICE_HOSTNAME);
      Serial.println(".local");
    }
  } else {
    Serial.println();
    Serial.println("WiFi connection failed");
  }
}

bool WiFiConnection::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}

String WiFiConnection::getIpAddress() {
  return WiFi.localIP().toString();
}