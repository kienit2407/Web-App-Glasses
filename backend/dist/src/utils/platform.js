"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformFromReq = void 0;
const getPlatformFromReq = (req) => {
    const raw = String(req.headers['x-client-platform'] || 'web').toLowerCase();
    if (raw === 'mobile')
        return 'mobile';
    return 'web'; // default
};
exports.getPlatformFromReq = getPlatformFromReq;
