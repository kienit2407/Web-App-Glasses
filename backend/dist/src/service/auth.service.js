"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const user_model_1 = require("../models/user.model");
const app_errol_1 = require("../utils/app_errol");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const signUp = async (payload, platform, res) => {
    const { email, display_name, password } = payload;
    const existed = await user_model_1.User.findOne({ email });
    if (existed) {
        throw new app_errol_1.BadRequestException('Email đã được đăng ký');
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashed_pwd = await bcryptjs_1.default.hash(payload.password, salt);
    const user = await user_model_1.User.create({
        email,
        display_name: display_name,
        hashed_password: hashed_pwd,
        role: ['user']
    });
    const tokens = await (0, jwt_1.generateToken)(String(user._id), res, platform);
    return {
        tokens
    };
};
const signIn = async (payload, platform, res) => {
    const { email, password } = payload;
    const user = await user_model_1.User.findOne({ email });
    if (!user || !user.hashed_password) {
        throw new app_errol_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.hashed_password);
    if (!isMatch) {
        throw new app_errol_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const tokens = await (0, jwt_1.generateToken)(String(user._id), res, platform);
    return { tokens };
};
const refreshToken = async (rawRefreshToken, platform, res) => {
    if (!rawRefreshToken) {
        throw new app_errol_1.UnauthorizedException('No refresh token provided');
    }
    const tokens = await (0, jwt_1.rotateToken)(rawRefreshToken, res, platform);
    return { tokens };
};
const logOut = async (rawRefreshToken, platform, res) => {
    if (rawRefreshToken) {
        await (0, jwt_1.revokeSessionByRefresh)(rawRefreshToken);
    }
    // web bắt buộc phải xoá cookie
    if (platform === 'web') {
        (0, jwt_1.clearRefreshCookie)(res);
    }
};
exports.authService = {
    signUp,
    signIn,
    logOut,
    refreshToken
};
