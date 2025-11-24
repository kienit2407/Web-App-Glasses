import { StatusCodes } from 'http-status-codes'
export const ErrorCodes = {
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',
    ERR_UNTHORIZED: "ERR_UNTHORIZED",
    ERR_FORBIDDEN: "ERR_FORBIDDEN",
    ERR_NOT_FOUND: "ERR_NOT_FOUND",
} as const


class AppError extends Error {
    constructor(
        message : string,
        public statusCode : number, 
    ) {
        super(message) // Gọi contructor  cả Error
        this.name = 'ApiError'
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor) // GHI LẠI STACK TRACE
    }
}
export default AppError

export class InternalServerException extends AppError {
    constructor( message : string = "Internal Server Error") {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR)
    }
}
export class ForbiddenException extends AppError {
    constructor( message : string = "Forbidden Error") {
        super(message, StatusCodes.FORBIDDEN)
    }
}
export class NotFoundException extends AppError {
    constructor( message : string = "Not Found") {
        super(message, StatusCodes.NOT_FOUND)
    }
}
export class BadRequestException extends AppError {
    constructor( message : string = "Bad Request") {
        super(message, StatusCodes.BAD_REQUEST)
    }
}
export class UnauthorizedException extends AppError {
    constructor( message : string = "Unauthorized Access") {
        super(message, StatusCodes.UNAUTHORIZED)
    }
}