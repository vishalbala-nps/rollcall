#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEAdvertising.h>
#include <BLEUtils.h>
#include <WiFi.h>
#include <stdint.h>
#include "time.h"
#include "config.h"
#include "logger.h"
#include "totp.h"

#define SERVICE_UUID "12345678-1234-1234-1234-123456789abc"
#define wifiLED 2
bool wifiOn = true;
uint32_t prevTotp = 0;
struct tm timeinfo;
BLEAdvertising* pAdvertising;

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
  pinMode(wifiLED,OUTPUT);
  LOG_I("BEACON", "RollCall Beacon Initializng");
  LOG_I("INFO","Initilazing BLE");

  BLEDevice::init("RollCall Bluetooth LE Beacon");
  pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x00);

  LOG_I("WIFI", "Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
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
    LOG_I("WIFI", "Time synced Successfully. Turning off WiFi");
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    delay(2000);
    wifiOn = false;
    LOG_I("WIFI", "Wifi Turned Off Successfully");
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

    BLEAdvertisementData advData;
    advData.setCompleteServices(BLEUUID(SERVICE_UUID));
    advData.setManufacturerData(buildManufacturerData(code));
    BLEDevice::stopAdvertising();
    pAdvertising->setAdvertisementData(advData);
    BLEDevice::startAdvertising();
    LOG_I("BLE","Broadcasting new TOTP");
  }

  delay(totpRefreshInterval * 1000);
}
