"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errolHandlingMiddleware = void 0;
const environment_1 = require("../config/environment");
const http_status_codes_1 = require("http-status-codes");
const errolHandlingMiddleware = (err, req, res, next) => {
    if (!err.statusCode)
        err.statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR; // nếu như không có status code thì mặc địnxh sẽ lấy code từ server trả về
    const responseError = {
        statusCode: err.statusCode, // trả về status code đẻ fe xử lý
        msg: err.message ?? http_status_codes_1.StatusCodes[err.statusCode], // nếu lỗi thì không có message thì lấy mã lỗi từ server trả vè luôn
        stack: err.stack
    };
    console.error(responseError);
    // có thể phát triẻn thêm bắn lỗi trong email, telegram,.../ bắt notifycation sang các trang mạng xã hôi khác là dự án đang bị lỗi
    console.log(`env.BUILD_MODE: ${environment_1.env.NODE_BUILD}`);
    if (environment_1.env.NODE_BUILD.trim() !== 'dev')
        delete responseError.stack; //nếu k phải là môi trường dev thì xoá stack đi. vì production không cân hiển thị làm gì
    // trả response vè status code
    res.status(responseError.statusCode).json(responseError);
};
exports.errolHandlingMiddleware = errolHandlingMiddleware;
