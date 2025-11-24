import { NextFunction, RequestHandler, Request, Response } from "express";
import AppError, { InternalServerException } from "./app_errol";

export const TryCatch = (handler: RequestHandler): RequestHandler => { // nhận vào 1 handler theo kiểu ReqHandler (req, res, next)
    return async (req: Request, res: Response, next: NextFunction) => { //trả về 1 hàm bất động bộ
        try {
            await handler(req, res, next)
        } catch (error: any) {
            console.error("Controller error:", error);
            console.error("Controller error message:", error.message);

            // Nếu đã là lỗi business (AppError) thì giữ nguyên
            if (error instanceof AppError) {
                return next(error)
            }
            // Còn lại wrap thành lỗi 500
            return next(new InternalServerException())
        }
    }
}

