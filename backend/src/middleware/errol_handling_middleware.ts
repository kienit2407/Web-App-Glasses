import  { env } from "../config/environment"
import { StatusCodes } from 'http-status-codes'
import { Response, Request, NextFunction } from "express"

export const errolHandlingMiddleware = (err : any , req : Request, res : Response, next : NextFunction) => {
    if(!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR // nếu như không có status code thì mặc địnxh sẽ lấy code từ server trả về

    const responseError = {
        statusCode: err.statusCode, // trả về status code đẻ fe xử lý
        msg: err.message ?? StatusCodes[err.statusCode], // nếu lỗi thì không có message thì lấy mã lỗi từ server trả vè luôn
        stack: err.stack
    }
    console.error(responseError)
    // có thể phát triẻn thêm bắn lỗi trong email, telegram,.../ bắt notifycation sang các trang mạng xã hôi khác là dự án đang bị lỗi
    console.log(`env.BUILD_MODE: ${env.NODE_BUILD}`)
    if(env.NODE_BUILD.trim() !== 'dev') delete responseError.stack //nếu k phải là môi trường dev thì xoá stack đi. vì production không cân hiển thị làm gì
    
    // trả response vè status code
    res.status(responseError.statusCode).json(responseError)
}