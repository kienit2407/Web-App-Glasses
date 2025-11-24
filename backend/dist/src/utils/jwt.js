"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRefreshCookie = exports.revokeSessionByRefresh = exports.rotateToken = exports.verifyAccessToken = exports.getRefreshFromRequest = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const redis_1 = __importDefault(require("../config/redis"));
const crypto_1 = __importDefault(require("crypto"));
const app_errol_1 = require("./app_errol");
const ACCESS_TTL = '15m'; // JWT
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REFRESH_COOKIE_NAME = 'refreshToken';
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const generateToken = async (userId, res, platform) => {
    // res: Response là object response của Express, dùng để gửi cookie về client.
    // 1. Tạo Access Token (JWT - ngắn hạn)
    const accessToken = jsonwebtoken_1.default.sign({ userId }, environment_1.env.JWT_ACCESS_SECRET, {
        // process.env.JWT_SECRET! → secret key để ký token
        expiresIn: ACCESS_TTL //expiresIn: "7d" → token sẽ hết hạn sau 7 ngày.
    });
    // do là refreshToken nếu đăng kí bằng jwt thì khi bị đánh cắp dù xoá trong database đi chăng nữa thì refresh token vẫn còn hạn thì vẫn bị như thường
    // 2. Tạo Refresh Token (Crypto - dài hạn)
    const refreshToken = crypto_1.default.randomBytes(64).toString('hex'); // tiếng hành random refreshToken
    // 3. Hash Refresh Token (để lưu vào DB/Redis)
    // Go ahead hash Token
    const refreshTokenHash = hashToken(refreshToken);
    // Then random sessionId
    // const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET!, { //jwt.sign(payload, secret, options) → tạo JWT (payload là userid thông tin mà sẽ được encode trong token )
    //     // process.env.JWT_SECRET! → secret key để ký token
    //     expiresIn: "7d" //expiresIn: "7d" → token sẽ hết hạn sau 7 ngày.
    // })
    // Lưu session vào DB
    // await Session.create({
    //     userId,
    //     refreshTokenHash,
    //     device: meta?.device,
    //     ip: meta?.ip,
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    // });
    // --- 4. SỬA LỖI REDIS (Hỗ trợ nhiều thiết bị) ---
    // Chúng ta không lưu `userId -> token`.
    // Chúng ta lưu `hash -> userId`.
    // Điều này cho phép 1 user có NHIỀU hash (nhiều thiết bị).
    const redisKey = `refresh_token:${refreshTokenHash}`; // chúng ta không lưu userid nữa vì lúc mà refresh có biết phải người dùng k mà dùng id
    const redisTTL = 7 * 24 * 60 * 60; // lưu thời gian => 7 ngàyy
    // ở đây chúng ta có 1 conflict. Đó chính là nếu mà dùng user id làm key 
    //Trường hợp 1:
    /*
        Web đăng nhập lưu rf_token với user id là: user_123
        Mobile đăng nhập vào lưu rf_token user id là: user_123
        KẾT QUẢ: rf_token bị ghì đè rồi web vô lại là cook luôn
        => Một user có nhiều rf_token (web, divice, hoặc trên nhiều thiết bị)
     */
    //set(key, value, )
    await redis_1.default.setEx(redisKey, redisTTL, JSON.stringify({
        userId
    }));
    // 'NX': true // lệnh chống ghi đè (Not exist) => chỉ set key khi nó chưa tồn tại thôi// cái này nó ngược lại là nó dùng refresh token để trả lại user id // nHƯNG MÀ Refresh này là luôn luôn đúng cho nên cmt lại
    //day - hours - minutes - seconds * 1000 miliseconds
    if (platform === "web") {
        res.cookie("refreshToken", refreshToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày //→ cookie sống 7 ngày.
            httpOnly: true, //JS trên client không đọc được cookie (tăng bảo mật).
            sameSite: "none", //chỉ gửi cookie khi request cùng domain (chống CSRF cơ bản).
            secure: true //chỉ gửi cookie qua HTTPS nếu không phải dev.
        });
        // /7 * 24 * 60 * 60 * 1000
        return { accessToken };
    }
    else {
        return { accessToken, refreshToken };
    }
};
exports.generateToken = generateToken;
// Lấy refreshToken từ cookie (web) hoặc body (mobile):
const getRefreshFromRequest = (req, platform) => {
    if (platform === 'web') {
        return req.cookies?.refreshToken ?? null;
    }
    return req.body?.refreshToken ?? null;
};
exports.getRefreshFromRequest = getRefreshFromRequest;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_ACCESS_SECRET);
        return decoded;
    }
    catch (err) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
const rotateToken = async (rawRefreshToken, res, platform) => {
    const refreshHash = hashToken(rawRefreshToken); // lấy cáu raw để hash xem có trùng với cái trong redis k
    const redisKey = `refresh_token:${refreshHash}`;
    const sessionJson = await redis_1.default.get(redisKey);
    if (!sessionJson)
        throw new app_errol_1.UnauthorizedException('Invalid refresh token'); // k có token
    const userSession = JSON.parse(sessionJson);
    await redis_1.default.del(redisKey);
    // Cấp session mới
    return (0, exports.generateToken)(userSession.userId, res, platform);
};
exports.rotateToken = rotateToken;
const revokeSessionByRefresh = async (rawRefreshToken) => {
    const refreshHash = hashToken(rawRefreshToken);
    const redisKey = `refresh_token:${refreshHash}`;
    await redis_1.default.del(redisKey);
};
exports.revokeSessionByRefresh = revokeSessionByRefresh;
const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'none',
        secure: false
    });
};
exports.clearRefreshCookie = clearRefreshCookie;
