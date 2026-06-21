#pragma once
#include <Arduino.h>

void log(const char* level, const char* tag, const char* msg) {
    Serial.print("[");
    Serial.print(level);
    Serial.print("] [");
    Serial.print(tag);
    Serial.print("] ");
    Serial.println(msg);
}

#define LOG_D(tag, msg) log("DEBUG", tag, msg)
#define LOG_I(tag, msg) log("INFO ", tag, msg)
#define LOG_W(tag, msg) log("WARN ", tag, msg)
#define LOG_E(tag, msg) log("ERROR", tag, msg)
