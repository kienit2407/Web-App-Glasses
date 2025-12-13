import { NextFunction, Request, Response } from 'express'
import { IUser, User } from '../models/user.model'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { env } from '../config/environment'
import { sendAsFailure } from '../utils/send_status'
import AppError, { ForbiddenException, NotFoundException, UnauthorizedException } from '../utils/app_errol'
import { Platform } from '../utils/jwt'

// Định nghĩa kiểu cho JWT payload
interface JwtPayload {
  userId: string,
  platform: Platform,
  role?: 'user' | 'admin'
}
declare module 'express'; // mở rộng kiể express
declare global {
  namespace Express { // cách 1
    interface Request {
      user?: IUser // Kiểu của user, tùy thuộc vào model của bạn
    }
  }
}

const getBearer = (req: Request) => {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  return h.split(' ')[1]
}

const protectUserRoute = async (req: Request, res: Response, next: NextFunction) => { // bảo về route xacs nhận người dùng đã đăng nhập

  try {
    const token = getBearer(req) // check accesstoken gửi lê
    if (!token) {
        req.user = undefined; // Gán cho rõ ràng (hoặc để undefined cũng dc) -> guest
        return next(); 
    }
    console.log("token từ fe gùi xuống: ", token)
    // if (!token) return next(new UnauthorizedException('No access token')) // quăng ra lỗi k có access token


    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload // chứa user id và role 

    const user = await User.findById(decoded.userId).select('-hashed_password') // kiểm tra xem có trường id mà lúc trước đã encode rồi

    if (!user) return next(new NotFoundException('User not found'))
    if (!user.is_active) return next(new ForbiddenException('Account disabled')) // kiểm tra xem user còn hoạt động nếu k thì bỏ

    // trả về user đã indentify thàn công
    req.user = user
    next()
  } catch (error: any) {
    next(new UnauthorizedException('Invalid or expired token'))
  }
}

const protectAdminRoute = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedException())
  if (!req.user.roles.includes('admin')) return next(new ForbiddenException('Admin only'))
  next()
}

export const authMidleWares = {
  protectUserRoute,
  protectAdminRoute
}