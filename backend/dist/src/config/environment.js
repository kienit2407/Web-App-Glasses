"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_LOCAL: process.env.MONGODB_LOCAL,
    DATABASE_NAME: process.env.DATABASE_NAME,
    PASSWORD_DB: process.env.PASSWORD_DB,
    APP_HOST: process.env.APP_HOST,
    APP_PORT: process.env.APP_PORT,
    AUTHOR: process.env.AUTHOR,
    NODE_BUILD: process.env.NODE_BUILD,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    REDIS_LOCAL: process.env.REDIS_LOCAL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    TRANSFER: process.env.TRANSFER,
    VNP_TMN_CODE: process.env.VNP_TMN_CODE,
    VNP_HASH_SECRET: process.env.VNP_HASH_SECRET,
    VNP_URL: process.env.VNP_URL,
    VNP_RETURN_URL: process.env.VNP_RETURN_URL,
    VNP_LOCALE: process.env.VNP_LOCALE || "vn",
    VNP_CURR_CODE: "VND",
    TOKEN_API_GHN: process.env.TOKEN_API_GHN,
    URL_API_GHN: process.env.URL_API_GHN,
    SHOP_ID: process.env.SHOP_ID,
    GHN_SERVICE_TYPE_STANDARD: process.env.GHN_SERVICE_TYPE_STANDARD,
    GHN_SERVICE_TYPE_FAST: process.env.GHN_SERVICE_TYPE_FAST,
    GHN_DEFAULT_SERVICE_TYPE_ID: process.env.GHN_DEFAULT_SERVICE_TYPE_ID,
    REALISTIC_GRAM: process.env.REALISTIC_GRAM,
    FRONTEND_URL: process.env.FRONTEND_URL
};
