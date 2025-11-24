import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { getPlatformFromReq } from "../../../utils/platform";
import { authService, SignIn, SignUp } from "../services/auth.service";
import { sendAsSuccess } from "../../../utils/send_status";
import { StatusCodes } from "http-status-codes";
import { getRefreshFromRequest } from "../../../utils/jwt";
import { normalizeIp } from "../../../utils/format_ip";


const signUp = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const payload: SignUp = req.body
  const userAgent = req.headers["user-agent"] || "unknown"
  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null
  const ip = normalizeIp(rawIp)
  const result = await authService.signUp(payload, platform, res, { userAgent, ip })
  return sendAsSuccess(
    res,
    StatusCodes.CREATED,
    result,
    'Đăng ký thành công'
  )
})

const signIn = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const payload: SignIn = req.body
  const platform = getPlatformFromReq(req)
  const userAgent = req.headers["user-agent"] || "unknown"

  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null
  const ip = normalizeIp(rawIp)
  console.log(userAgent)
  const result = await authService.signIn(payload, platform, res, { userAgent, ip })
  return sendAsSuccess(
    res,
    StatusCodes.OK,
    result,
    'Đăng nhập thành công'
  )
})

const logOut = TryCatch(async (req: Request, res: Response, _next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const rawRefresh = getRefreshFromRequest(req, platform) // Từ web hoặc mobile

  await authService.logOut(rawRefresh, platform, res)

  return sendAsSuccess(
    res,
    StatusCodes.OK,
    'Đăng xuất thành công'
  )
})
const refreshToken = TryCatch(async (req: Request, res: Response, _next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const rawRefresh = getRefreshFromRequest(req, platform)

  const result = await authService.refreshToken(rawRefresh, platform, res)

  return sendAsSuccess(
    res,
    StatusCodes.OK,
    result,
    'Làm mới token thành công'
  )
})
export const authController = {
  signUp,
  signIn,
  logOut,
  refreshToken
}

