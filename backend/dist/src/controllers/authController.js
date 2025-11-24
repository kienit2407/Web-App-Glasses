"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const try_catch_1 = require("../utils/try_catch");
const platform_1 = require("../utils/platform");
const auth_service_1 = require("../service/auth.service");
const send_status_1 = require("../utils/send_status");
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("../utils/jwt");
const signUp = (0, try_catch_1.TryCatch)(async (req, res, next) => {
    const platform = (0, platform_1.getPlatformFromReq)(req);
    const payload = req.body;
    const result = await auth_service_1.authService.signUp(payload, platform, res);
    return (0, send_status_1.sendAsSuccess)(res, http_status_codes_1.StatusCodes.CREATED, result, 'Đăng ký thành công');
});
const signIn = (0, try_catch_1.TryCatch)(async (req, res, next) => {
    const payload = req.body;
    const platform = (0, platform_1.getPlatformFromReq)(req);
    const result = await auth_service_1.authService.signIn(payload, platform, res);
    return (0, send_status_1.sendAsSuccess)(res, http_status_codes_1.StatusCodes.OK, result, 'Đăng nhập thành công');
});
const logOut = (0, try_catch_1.TryCatch)(async (req, res, _next) => {
    const platform = (0, platform_1.getPlatformFromReq)(req);
    const rawRefresh = (0, jwt_1.getRefreshFromRequest)(req, platform); // Từ web hoặc mobile
    await auth_service_1.authService.logOut(rawRefresh, platform, res);
    return (0, send_status_1.sendAsSuccess)(res, http_status_codes_1.StatusCodes.OK, 'Đăng xuất thành công');
});
const refreshToken = (0, try_catch_1.TryCatch)(async (req, res, _next) => {
    const platform = (0, platform_1.getPlatformFromReq)(req);
    const rawRefresh = (0, jwt_1.getRefreshFromRequest)(req, platform);
    const result = await auth_service_1.authService.refreshToken(rawRefresh, platform, res);
    return (0, send_status_1.sendAsSuccess)(res, http_status_codes_1.StatusCodes.OK, result, 'Làm mới token thành công');
});
exports.authController = {
    signUp,
    signIn,
    logOut,
    refreshToken
};
