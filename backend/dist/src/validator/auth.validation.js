"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const app_errol_1 = __importDefault(require("../utils/app_errol"));
const http_status_codes_1 = require("http-status-codes");
const signUp = (async (req, res, next) => {
    const correctCondition = joi_1.default.object({
        display_name: joi_1.default.string().required().min(3).max(50).strict(),
        email: joi_1.default.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
            'string.pattern.base': 'Email Invalid', // k matching với Regex
            'string.empty': 'Email không được để trống', //trường này để trống
            'any.required': 'Email là trường bắt buộc' // 
        }),
        hashed_password: joi_1.default.string().pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])")).min(8).required().max(20).messages({
            'string.pattern.base': 'Password Invalid',
            'string.empty': 'Password not empty',
            'any.required': 'Password is required',
            'string.min': 'Password must be least 8 character',
        }).required()
    });
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        });
        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next();
    }
    catch (error) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message;
        next(new app_errol_1.default(message, http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY));
        // next(error)
        // gửi vào đây một message
    }
});
const logIn = (async (req, res, next) => {
    const correctCondition = joi_1.default.object({
        email: joi_1.default.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
            'string.pattern.base': 'Email Invalid', // k matching với Regex
            'string.empty': 'Email không được để trống', //trường này để trống
            'any.required': 'Email là trường bắt buộc' // 
        }),
        password: joi_1.default.string().required()
    });
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        });
        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next();
    }
    catch (error) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message;
        next(new app_errol_1.default(message, http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY));
        // next(error)
        // gửi vào đây một message
    }
});
const verifyOtp = (async (req, res, next) => {
    const correctCondition = joi_1.default.object({
        email: joi_1.default.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
            'string.pattern.base': 'Email Invalid', // k matching với Regex
            'string.empty': 'Email không được để trống', //trường này để trống
            'any.required': 'Email là trường bắt buộc' // 
        }),
        otp: joi_1.default.string().required()
    });
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        });
        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next();
    }
    catch (error) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message;
        next(new app_errol_1.default(message, http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY));
        // next(error)
        // gửi vào đây một message
    }
});
exports.authValidator = {
    signUp,
    logIn,
    verifyOtp
};
