// src/lib/vnpay.ts
import { HashAlgorithm, ignoreLogger, VNPay } from "vnpay";
import { env } from "../config/environment";

export const vnpay = new VNPay({
    tmnCode: env.VNP_TMN_CODE.trim(),
    secureSecret: env.VNP_HASH_SECRET.trim(),
    vnpayHost: 'https://sandbox.vnpayment.vn', // "https://sandbox.vnpayment.vn"
    testMode: true,                      // sandbox
    hashAlgorithm: HashAlgorithm.SHA512, // ✅dùng enum, không dùng string
    enableLog: true,
    loggerFn: ignoreLogger,
    endpoints: {
        paymentEndpoint: "paymentv2/vpcpay.html",
    },
});