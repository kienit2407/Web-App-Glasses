import { IAuthProvider, IUser, User } from "../../../models/user.model"
import { BadRequestException, UnauthorizedException } from "../../../utils/app_errol"
import { clearRefreshCookie, generateToken, Platform, revokeSessionByRefresh, rotateToken } from "../../../utils/jwt"
import { Response } from "express";
import bcrypt from "bcryptjs";
import { LoginHistory } from "../../../models/login_history.model";
import axios from "axios";
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
const upsertAuthProvider = (
    user: IUser,
    provider: IAuthProvider["provider"],
    provider_id: string | null
) => {
    if (!user.auth_provider) {
        user.auth_provider = []
    }

    const existing = user.auth_provider.find((p) => p.provider === provider)

    if (existing) {
        // chỉ update provider_id nếu chưa có
        if (!existing.provider_id && provider_id) {
            existing.provider_id = provider_id
        }
    } else {
        user.auth_provider.push({
            provider,
            provider_id,
        })
    }
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
        auth_provider: [
            { provider: 'password', provider_id: null },
        ],
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
const signInWithGithub = async (
    githubAccessToken: string,
    platform: Platform,
    res: Response,
    clientInfo: ClientInfo
) => {
    const userRes = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
    })

    const ghUser = userRes.data as {
        id: number
        login: string
        name?: string
        avatar_url?: string
    }

    const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
    })

    const emails = emailRes.data as { email: string; primary: boolean; verified: boolean }[]
    const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0]

    if (!primaryEmail) {
        throw new BadRequestException('Không lấy được email từ GitHub')
    }

    let user = await User.findOne({ email: primaryEmail.email })

    if (!user) {
        user = await User.create({
            email: primaryEmail.email,
            display_name: ghUser.name || ghUser.login || primaryEmail.email,
            password: null,
            roles: ['user'],
            avatar_url: ghUser.avatar_url || null,
            auth_provider: [
                {
                    provider: 'github',
                    provider_id: String(ghUser.id),
                },
            ],
            last_login: {
                device: `${platform} | ${clientInfo.userAgent}`,
                atTime: new Date(),
                ip: clientInfo.ip,
            },
        })
    } else {
        upsertAuthProvider(user, 'github', String(ghUser.id))
    }

    user.last_login = {
        device: `${platform} | ${clientInfo.userAgent}`,
        atTime: new Date(),
        ip: clientInfo.ip,
    }
    await user.save()

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

const signInWithGoogle = async (
    googleAccessToken: string,
    platform: Platform,
    res: Response,
    clientInfo: ClientInfo
) => {
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
    })

    const ggUser = userRes.data as {
        id: string
        email: string
        name: string
        picture?: string
    }

    if (!ggUser.email) {
        throw new BadRequestException('Không lấy được email từ Google')
    }

    let user = await User.findOne({ email: ggUser.email })

    if (!user) {
        // Lần đầu: tạo user với data từ Google
        user = await User.create({
            email: ggUser.email,
            display_name: ggUser.name || ggUser.email,
            password: null,
            roles: ['user'],
            avatar_url: ggUser.picture || null,
            auth_provider: [
                {
                    provider: 'google',
                    provider_id: ggUser.id,
                },
            ],
            last_login: {
                device: `${platform} | ${clientInfo.userAgent}`,
                atTime: new Date(),
                ip: clientInfo.ip,
            },
        })
    } else {
        // Đã có user (local hoặc provider khác), không override name/avatar
        upsertAuthProvider(user, 'google', ggUser.id)
    }

    // cập nhật last_login + login history + token
    user.last_login = {
        device: `${platform} | ${clientInfo.userAgent}`,
        atTime: new Date(),
        ip: clientInfo.ip,
    }
    await user.save()

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
    refreshToken,
    signInWithGoogle,
    signInWithGithub,   
}
