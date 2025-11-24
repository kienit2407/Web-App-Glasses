"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMidleWares = void 0;
const user_model_1 = require("../models/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const app_errol_1 = require("../utils/app_errol");
const getBearer = (req) => {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer '))
        return null;
    return h.split(' ')[1];
};
const protectUserRoute = async (req, res, next) => {
    try {
        const token = getBearer(req); // check accesstoken gửi lê
        if (!token)
            return next(new app_errol_1.UnauthorizedException('No access token')); // quăng ra lỗi k có access token
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_ACCESS_SECRET); // chứa user id và role 
        const user = await user_model_1.User.findById(decoded.userId).select('-hashed_password'); // kiểm tra xem có trường id mà lúc trước đã encode rồi
        if (!user)
            return next(new app_errol_1.NotFoundException('User not found'));
        if (!user.is_active)
            return next(new app_errol_1.ForbiddenException('Account disabled')); // kiểm tra xem user còn hoạt động nếu k thì bỏ
        // trả về user đã indentify thàn công
        req.user = user;
        next();
    }
    catch (error) {
        next(new app_errol_1.UnauthorizedException('Invalid or expired token'));
    }
};
const protectAdminRoute = async (req, res, next) => {
    if (!req.user)
        return next(new app_errol_1.UnauthorizedException());
    if (!req.user.roles.includes('admin'))
        return next(new app_errol_1.ForbiddenException('Admin only'));
    next();
};
exports.authMidleWares = {
    protectUserRoute,
    protectAdminRoute
};
