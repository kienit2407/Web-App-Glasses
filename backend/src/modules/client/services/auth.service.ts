import { User } from "../../../models/user.model"
import { BadRequestException, UnauthorizedException } from "../../../utils/app_errol"
import { clearRefreshCookie, generateToken, Platform, revokeSessionByRefresh, rotateToken } from "../../../utils/jwt"
import { Response } from "express";
import bcrypt from "bcryptjs";
import { LoginHistory } from "../../../models/login_history.model";
export interface SignUp {
    email: string
    display_name: string
    password: string
}
interface ClientInfo {
    userAgent: string
    ip: string | null
}
export interface SignIn {
    email: string
    password: string
}
const signUp = async (
    payload: SignUp,
    platform: Platform,
    res: Response,
    clientInfo: ClientInfo
) => {
    const { email, display_name, password } = payload
    const existed = await User.findOne({ email })
    if (existed) {
        throw new BadRequestException('Email đã được đăng ký')
    }
    const salt = await bcrypt.genSalt(10)
    const hashed_pwd = await bcrypt.hash(password, salt)

    const user = await User.create({
        email,
        display_name: display_name,
        password: hashed_pwd,
        roles: ['user'],
        last_login: {
            device: `${platform} | ${clientInfo.userAgent}`,
            atTime: new Date(),
        }
    })
    // 2) Ghi log vào bảng lịch sử
    await LoginHistory.create({
        user_id: user._id,
        platform,
        device: clientInfo.userAgent,
        ip: clientInfo.ip,
        user_agent: `${platform} | ${clientInfo.userAgent}`,
    })
    const tokens = await generateToken(String(user._id), res, platform)

    return {
        tokens
    }
}
const signIn = async (
    payload: SignIn,
    platform: Platform,
    res: Response,
    clientInfo: ClientInfo
) => {
    const { email, password } = payload


    const user = await User.findOne({ email }).select('+password')

    if (!user || !user.password) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    }
    // 1) Cập nhật last_login trên User
    user.last_login = {
        device: `${platform} | ${clientInfo.userAgent}`,
        ip: clientInfo.ip,
        atTime: new Date(),
    }
    await user.save()

    // 2) Ghi log vào bảng lịch sử
    await LoginHistory.create({
        user_id: user._id,
        platform,
        device: clientInfo.userAgent,
        ip: clientInfo.ip,
        user_agent: `${platform} | ${clientInfo.userAgent}`,
    })

    const tokens = await generateToken(String(user._id), res, platform)

    return { tokens }
}
const refreshToken = async (
    rawRefreshToken: string | null,
    platform: Platform,
    res: Response
) => {
    if (!rawRefreshToken) {
        throw new UnauthorizedException('No refresh token provided')
    }
    const tokens = await rotateToken(rawRefreshToken, res, platform)
    return { tokens }
}

const logOut = async (
    rawRefreshToken: string | null,
    platform: Platform,
    res: Response
) => {
    if (rawRefreshToken) {
        await revokeSessionByRefresh(rawRefreshToken)
    }
    // web bắt buộc phải xoá cookie
    if (platform === 'web') {
        clearRefreshCookie(res)
    }
}
export const authService = {
    signUp,
    signIn,
    logOut,
    refreshToken
}
