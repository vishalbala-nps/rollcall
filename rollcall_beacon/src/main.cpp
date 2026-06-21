#include <WiFi.h>
#include <stdint.h>
#include "time.h"
#include "passwords.h"
#include "logger.h"
#include "totp.h"

#define wifiLED 2
bool wifiOn = true;
uint32_t prevTotp = 0;
struct tm timeinfo;

void setup() {
  Serial.begin(115200);
  pinMode(wifiLED,OUTPUT);
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
  digitalWrite(wifiLED, HIGH);

  LOG_I("NTP", "Syncing time NTP Server");
  configTime(0, 0, "time.nist.gov");
}

void loop() {
  if (!getLocalTime(&timeinfo)) {
    digitalWrite(wifiLED, LOW);
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

  uint32_t code = get_current_totp(secret);
  if (code != prevTotp) {
    digitalWrite(wifiLED, HIGH);
    prevTotp = code;
    char timestamp[64];
    strftime(timestamp, sizeof(timestamp), "%A, %B %d %Y %H:%M:%S", &timeinfo);
    LOG_I("TOTP", "TOTP Changed");
    LOG_I("TIME", timestamp);
    LOG_I("TOTP",code);
  }

  delay(30000);
}
