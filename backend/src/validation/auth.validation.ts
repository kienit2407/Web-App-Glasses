import Joi from "joi"
import AppError from '../utils/app_errol'
import { StatusCodes } from 'http-status-codes'
import { NextFunction, Request, Response } from "express"

const signUp = (async (req: Request, res: Response, next: NextFunction) => {

    const correctCondition = Joi.object({
        display_name: Joi.string().required().min(3).max(50).strict(),
        email: Joi.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
                'string.pattern.base': 'Email Invalid', // k matching với Regex
                'string.empty': 'Email không được để trống', //trường này để trống
                'any.required': 'Email là trường bắt buộc' // 
            }),
        password: Joi.string().pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])")).min(8).required().max(20).messages({
                'string.pattern.base': 'Password Invalid',
                'string.empty': 'Password not empty',
                'any.required': 'Password is required',
                'string.min': 'Password must be least 8 character',
            }).required()
    })
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        })


        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next()
    } catch (error: any) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message
        next(new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY))
        // next(error)
        // gửi vào đây một message
    }
})

const logIn = (async (req: Request, res: Response, next: NextFunction) => {

    const correctCondition = Joi.object({
        email: Joi.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
                'string.pattern.base': 'Email Invalid', // k matching với Regex
                'string.empty': 'Email không được để trống', //trường này để trống
                'any.required': 'Email là trường bắt buộc' // 
            }),
        password: Joi.string().required()
    })
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        })
        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next()
    } catch (error: any) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message
        next(new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY))
        // next(error)
        // gửi vào đây một message
    }
})
const verifyOtp = (async (req: Request, res: Response, next: NextFunction) => {

    const correctCondition = Joi.object({
        email: Joi.string().
            pattern(new RegExp("^[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z_+])*@(([0-9a-zA-Z][-\w]*\.)+[a-zA-Z]{2,9})$")).required().messages({
                'string.pattern.base': 'Email Invalid', // k matching với Regex
                'string.empty': 'Email không được để trống', //trường này để trống
                'any.required': 'Email là trường bắt buộc' // 
            }),
        otp: Joi.string().required()
    })
    try {
        // tiến hành kiểm tra
        await correctCondition.validateAsync(req.body, {
            abortEarly: true
        })
        //Nếu validate thành công req được chuyển qua controller thật sự
        //nếu validate thất bại thì nhảy vào catch
        next()
    } catch (error: any) {
        //nếu mà lỗi thì né sẽ bỏ qua toàn bộ những middlewares và controller còn lại (tức là không chạy authController nữa mà chuyển thẳng tới middleware nơi mà mình đã đăng kí là ở server)
        const message = error.details[0].message
        next(new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY))
        // next(error)
        // gửi vào đây một message
    }
})

export const authValidator = {
    signUp,
    logIn,
    verifyOtp
}