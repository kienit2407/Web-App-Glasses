"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = void 0;
const getClientIp = (req) => {
    const xff = req.headers["x-forwarded-for"] || "";
    return xff.split(",")[0].trim() || req.socket.remoteAddress || "";
};
exports.getClientIp = getClientIp;
