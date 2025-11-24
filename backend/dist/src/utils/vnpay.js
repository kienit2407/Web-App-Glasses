"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpay = void 0;
// src/lib/vnpay.ts
const vnpay_1 = require("vnpay");
const environment_1 = require("../config/environment");
exports.vnpay = new vnpay_1.VNPay({
    tmnCode: environment_1.env.VNP_TMN_CODE.trim(),
    secureSecret: environment_1.env.VNP_HASH_SECRET.trim(),
    vnpayHost: 'https://sandbox.vnpayment.vn', // "https://sandbox.vnpayment.vn"
    testMode: true, // sandbox
    hashAlgorithm: vnpay_1.HashAlgorithm.SHA512, // ✅dùng enum, không dùng string
    enableLog: true,
    loggerFn: vnpay_1.ignoreLogger,
    endpoints: {
        paymentEndpoint: "paymentv2/vpcpay.html",
    },
});
