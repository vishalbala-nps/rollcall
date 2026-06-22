#pragma once
#include <stdint.h>
#include <string.h>
#include <time.h>
#include <ctype.h>
#include "mbedtls/md.h"
#include "config.h"

static const char BASE32_CHARS[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

int base32_decode(const char *input, uint8_t *output, size_t out_len) {
    size_t len = strlen(input);
    size_t out_idx = 0;
    uint32_t buffer = 0;
    int bits_left = 0;

    for (size_t i = 0; i < len && out_idx < out_len; i++) {
        char c = toupper((unsigned char)input[i]);
        if (c == '=') break;
        const char *pos = strchr(BASE32_CHARS, c);
        if (!pos) return -1;
        buffer <<= 5;
        buffer |= (pos - BASE32_CHARS);
        bits_left += 5;
        if (bits_left >= 8) {
            output[out_idx++] = (buffer >> (bits_left - 8)) & 0xFF;
            bits_left -= 8;
        }
    }
    return out_idx;
}

uint32_t totp_generate(const uint8_t *secret, size_t secret_len, uint64_t T) {
    uint8_t msg[8];
    for (int i = 7; i >= 0; i--) {
        msg[i] = T & 0xFF;
        T >>= 8;
    }

    uint8_t hmac[20];
    mbedtls_md_context_t ctx;
    const mbedtls_md_info_t *info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA1);

    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, info, 1);
    mbedtls_md_hmac_starts(&ctx, secret, secret_len);
    mbedtls_md_hmac_update(&ctx, msg, 8);
    mbedtls_md_hmac_finish(&ctx, hmac);
    mbedtls_md_free(&ctx);

    int offset = hmac[19] & 0x0F;
    uint32_t code = ((hmac[offset]     & 0x7F) << 24)
                  | ((hmac[offset + 1] & 0xFF) << 16)
                  | ((hmac[offset + 2] & 0xFF) <<  8)
                  |  (hmac[offset + 3] & 0xFF);

    return code % 1000000;
}

// Call this after NTP sync
uint32_t get_current_totp(const char *base32_secret) {
    uint8_t secret_bytes[64];
    int secret_len = base32_decode(base32_secret, secret_bytes, sizeof(secret_bytes));
    if (secret_len < 0) return 0;

    time_t now;
    time(&now);

    return totp_generate(secret_bytes, secret_len, (uint64_t)now / cfg_totpRefreshInterval);
}