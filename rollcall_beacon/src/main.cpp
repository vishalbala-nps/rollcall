#include <WiFi.h>
#include "time.h"
#include "passwords.h"
#include "logger.h"

bool wifiOn = true;
struct tm timeinfo;

void setup() {
  Serial.begin(115200);
  LOG_I("BEACON", "RollCall Beacon starting");

  Serial.print("[INFO ] [WIFI] Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  LOG_I("WIFI", "Connected");

  LOG_I("NTP", "Syncing time from pool.ntp.org");
  configTime(0, 0, "pool.ntp.org");
}

void loop() {
  if (!getLocalTime(&timeinfo)) {
    LOG_W("TIME", "Waiting for NTP sync...");
    delay(1000);
    return;
  }

  if (wifiOn) {
    LOG_I("WIFI", "Time synced — disconnecting WiFi");
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    wifiOn = false;
  }

  char timestamp[64];
  strftime(timestamp, sizeof(timestamp), "%A, %B %d %Y %H:%M:%S", &timeinfo);
  LOG_I("TIME", timestamp);

  delay(1000);
}
