#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEAdvertising.h>
#include <BLEUtils.h>
#include <WiFi.h>
#include <stdint.h>
#include <LittleFS.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include "time.h"
#include "config.h"
#include "logger.h"
#include "totp.h"
#include "provisioning.h"

#define SERVICE_UUID "12345678-1234-1234-1234-123456789abc"
#define wifiLED 2

// Runtime config — populated from /config.json at boot


WebServer server(80);
bool wifiOn = true;
bool inProvisioning = false;
uint32_t prevTotp = 0;
struct tm timeinfo;
BLEAdvertising* pAdvertising;

void resetAndRestart() {
  LOG_E("CONFIG", "Resetting config and restarting...");
  LittleFS.format();
  delay(500);
  ESP.restart();
}

void loadConfig() {
  File f = LittleFS.open("/config.json", "r");
  if (!f) {
    LOG_E("CONFIG", "config.json not found");
    resetAndRestart();
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, f);
  f.close();
  if (err) {
    LOG_E("CONFIG", "Failed to parse config.json");
    resetAndRestart();
  }

  const char* required[] = { "ssid", "password", "secret", "beaconId", "totpRefreshInterval" };
  for (const char* key : required) {
    if (doc[key].isNull()) {
      LOG_E("CONFIG_MISSING", key);
      resetAndRestart();
    }
  }

  cfg_ssid                = doc["ssid"].as<String>();
  cfg_password            = doc["password"].as<String>();
  cfg_secret              = doc["secret"].as<String>();
  cfg_totpRefreshInterval = doc["totpRefreshInterval"].as<int>();

  const char* beaconHex = doc["beaconId"].as<const char*>();
  for (int i = 0; i < 2; i++) {
    char buf[3] = { beaconHex[i * 2], beaconHex[i * 2 + 1], '\0' };
    BEACON_ID[i] = (uint8_t)strtol(buf, nullptr, 16);
  }

  LOG_I("CONFIG", "Config loaded successfully");
}

std::string buildManufacturerData(uint32_t totp) {
  std::string data;
  data += (char)0xFF;
  data += (char)0xFF;

  for (int i = 0; i < 2; i++)
    data += (char)BEACON_ID[i];

  data += (char)((totp >> 24) & 0xFF);
  data += (char)((totp >> 16) & 0xFF);
  data += (char)((totp >>  8) & 0xFF);
  data += (char)((totp      ) & 0xFF);

  return data;
}

void setup() {
  Serial.begin(115200);
  pinMode(wifiLED, OUTPUT);
  LOG_I("BEACON", "RollCall Beacon Initializing");
  LittleFS.begin(true);

  File config = LittleFS.open("/config.json", "r");
  if (!config) {
    inProvisioning = true;
    LOG_I("INFO", "No Config Data Found. Entering Provisioning Mode");
    uint32_t chipId = (uint32_t)(ESP.getEfuseMac() >> 32);
    char apName[32];
    snprintf(apName, sizeof(apName), "RollCall_%08X", chipId);
    WiFi.softAP(apName);
    LOG_I("WIFI", apName);
    LOG_I("WIFI", WiFi.softAPIP().toString().c_str());

    server.on("/", HTTP_GET, []() {
      server.send_P(200, "text/html", PROVISIONING_HTML);
    });

    server.on("/provision", HTTP_POST, []() {
      String body = server.arg("plain");
      JsonDocument doc;
      DeserializationError err = deserializeJson(doc, body);
      if (err) {
        LOG_E("PROVISION", "Invalid JSON");
        server.send(400, "text/plain", "Invalid JSON");
        return;
      }

      const char* required[] = { "ssid", "password", "secret", "beaconId", "totpRefreshInterval" };
      for (const char* key : required) {
        if (doc[key].isNull()) {
          LOG_E("PROVISION", key);
          server.send(400, "text/plain", String("Missing field: ") + key);
          return;
        }
      }

      File f = LittleFS.open("/config.json", "w");
      if (!f) {
        LOG_E("PROVISION", "Failed to open config.json for writing");
        server.send(500, "text/plain", "File write error");
        return;
      }
      serializeJson(doc, f);
      f.close();
      LOG_I("PROVISION", "Config saved. Restarting...");
      server.send(200, "text/plain", "OK");
      delay(500);
      ESP.restart();
    });

    server.begin();
  } else {
    config.close();
    loadConfig();

    LOG_I("INFO", "Initializing BLE");
    BLEDevice::init("RollCall Bluetooth LE Beacon");
    pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->setScanResponse(false);
    pAdvertising->setMinPreferred(0x00);

    LOG_I("WIFI", "Connecting to WiFi");
    WiFi.begin(cfg_ssid.c_str(), cfg_password.c_str());
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
}

void loop() {
  if (!inProvisioning) {
    if (!getLocalTime(&timeinfo)) {
      digitalWrite(wifiLED, LOW);
      LOG_W("TIME", "Waiting for NTP sync...");
      delay(1000);
      return;
    }

    if (wifiOn) {
      LOG_I("WIFI", "Time synced Successfully. Turning off WiFi");
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      delay(2000);
      wifiOn = false;
      LOG_I("WIFI", "WiFi Turned Off Successfully");
    }

    uint32_t code = get_current_totp(cfg_secret.c_str());
    if (code != prevTotp) {
      digitalWrite(wifiLED, HIGH);
      prevTotp = code;
      char timestamp[64];
      strftime(timestamp, sizeof(timestamp), "%A, %B %d %Y %H:%M:%S", &timeinfo);
      LOG_I("TOTP", "TOTP Changed");
      LOG_I("TIME", timestamp);
      LOG_I("TOTP", code);

      BLEAdvertisementData advData;
      advData.setCompleteServices(BLEUUID(SERVICE_UUID));
      advData.setManufacturerData(buildManufacturerData(code));
      BLEDevice::stopAdvertising();
      pAdvertising->setAdvertisementData(advData);
      BLEDevice::startAdvertising();
      LOG_I("BLE", "Broadcasting new TOTP");
    }

    delay(cfg_totpRefreshInterval * 1000);
  } else {
    server.handleClient();
  }
}
