/**
 * sha256.js — Pure-JavaScript SHA-256 implementation.
 * Single Responsibility: provide a synchronous SHA-256 digest function for
 * browsers that lack the SubtleCrypto API (IE 11 and below).
 *
 * This implementation is exposed as window.QC.sha256Sync(message) → hex string.
 *
 * Algorithm reference: FIPS PUB 180-4.
 * Written in ES5-compatible syntax (no arrow functions, no const/let, no classes).
 */

/* global QC */
var QC = QC || {};

QC.sha256Sync = (function () {
    'use strict';

    /* ── Pre-computed constants ──────────────────────────────────────── */
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    /* ── Bit-operation helpers ────────────────────────────────────────── */
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

    function σ0(x) { return rotr(x, 2)  ^ rotr(x, 13) ^ rotr(x, 22); }
    function σ1(x) { return rotr(x, 6)  ^ rotr(x, 11) ^ rotr(x, 25); }
    function γ0(x) { return rotr(x, 7)  ^ rotr(x, 18) ^ (x >>> 3);   }
    function γ1(x) { return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);  }

    function ch(x, y, z)  { return (x & y) ^ (~x & z); }
    function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }

    /* ── UTF-8 encode a JS string to a Uint8Array-equivalent array ───── */
    function toUtf8Bytes(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
            } else if (code >= 0xD800 && code <= 0xDBFF) {
                /* Surrogate pair */
                var hi = code;
                var lo = str.charCodeAt(++i);
                var cp = 0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00);
                bytes.push(
                    0xF0 | (cp >> 18),
                    0x80 | ((cp >> 12) & 0x3F),
                    0x80 | ((cp >> 6)  & 0x3F),
                    0x80 | (cp & 0x3F)
                );
            } else {
                bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
            }
        }
        return bytes;
    }

    /* ── Core SHA-256 computation ────────────────────────────────────── */
    function sha256(message) {
        var bytes = toUtf8Bytes(message);
        var len   = bytes.length;

        /* Pre-processing: append bit '1', zeros, and 64-bit length */
        bytes.push(0x80);
        while ((bytes.length % 64) !== 56) { bytes.push(0x00); }

        var bitLen = len * 8;
        /* 64-bit big-endian length: high 32 bits are zero for practical inputs */
        bytes.push(0, 0, 0, 0);
        bytes.push(
            (bitLen >>> 24) & 0xFF,
            (bitLen >>> 16) & 0xFF,
            (bitLen >>> 8)  & 0xFF,
             bitLen         & 0xFF
        );

        /* Initial hash values */
        var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
        var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

        /* Process each 512-bit (64-byte) chunk */
        for (var offset = 0; offset < bytes.length; offset += 64) {
            var w = [];
            var j;

            for (j = 0; j < 16; j++) {
                w[j] = (bytes[offset + j * 4]     << 24) |
                       (bytes[offset + j * 4 + 1] << 16) |
                       (bytes[offset + j * 4 + 2] << 8)  |
                        bytes[offset + j * 4 + 3];
            }
            for (j = 16; j < 64; j++) {
                w[j] = (γ1(w[j - 2]) + w[j - 7] + γ0(w[j - 15]) + w[j - 16]) | 0;
            }

            var a = h0, b = h1, c = h2, d = h3;
            var e = h4, f = h5, g = h6, h = h7;

            for (j = 0; j < 64; j++) {
                var t1 = (h + σ1(e) + ch(e, f, g) + K[j] + w[j]) | 0;
                var t2 = (σ0(a) + maj(a, b, c)) | 0;
                h = g; g = f; f = e; e = (d + t1) | 0;
                d = c; c = b; b = a; a = (t1 + t2) | 0;
            }

            h0 = (h0 + a) | 0; h1 = (h1 + b) | 0;
            h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
            h4 = (h4 + e) | 0; h5 = (h5 + f) | 0;
            h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
        }

        /* Produce the final 256-bit hash as a hex string */
        var parts = [h0, h1, h2, h3, h4, h5, h6, h7];
        var hex = '';
        for (var k = 0; k < parts.length; k++) {
            /* Force unsigned 32-bit, then zero-pad to 8 hex chars */
            hex += ('00000000' + (parts[k] >>> 0).toString(16)).slice(-8);
        }
        return hex;
    }

    return sha256;
}());
