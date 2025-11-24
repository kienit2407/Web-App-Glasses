"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = exports.BadRequestException = exports.NotFoundException = exports.ForbiddenException = exports.InternalServerException = exports.ErrorCodes = void 0;
const http_status_codes_1 = require("http-status-codes");
exports.ErrorCodes = {
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',
    ERR_UNTHORIZED: "ERR_UNTHORIZED",
    ERR_FORBIDDEN: "ERR_FORBIDDEN",
    ERR_NOT_FOUND: "ERR_NOT_FOUND",
};
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Gọi contructor  cả Error
        this.statusCode = statusCode;
        this.name = 'ApiError';
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor); // GHI LẠI STACK TRACE
    }
}
exports.default = AppError;
class InternalServerException extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
}
exports.InternalServerException = InternalServerException;
class ForbiddenException extends AppError {
    constructor(message = "Forbidden Error") {
        super(message, http_status_codes_1.StatusCodes.FORBIDDEN);
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends AppError {
    constructor(message = "Not Found") {
        super(message, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
}
exports.NotFoundException = NotFoundException;
class BadRequestException extends AppError {
    constructor(message = "Bad Request") {
        super(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends AppError {
    constructor(message = "Unauthorized Access") {
        super(message, http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
}
exports.UnauthorizedException = UnauthorizedException;
