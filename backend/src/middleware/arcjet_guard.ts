import { Request, Response, NextFunction } from 'express';
import aj from '../config/arcjet';

export const arcjetGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Lấy "thẻ tên" (Device ID) từ Header mà Flutter gửi lên
        // Nếu là Web thì thường không có cái này, ta dùng IP làm fallback
        const deviceId = req.headers['x-device-id'] as string;
        // [NÂNG CẤP CHO CLOUDFLARE]
        // Nếu req.ip bị lỗi, ta lấy trực tiếp từ header của Cloudflare
        // cf-connecting-ip là header chuẩn của Cloudflare chứa IP thật
        const realIp = (req.headers['cf-connecting-ip'] as string) || req.ip;
        // 2. Quyết định xem sẽ định danh user bằng cái gì
        // Nếu có deviceId thì dùng nó, nếu không thì dùng IP của request
        const fingerprint = deviceId || realIp || 'unknown-client';

        console.log(`[Arcjet] Checking protection for fingerprint: ${fingerprint}`);

        // 3. Gọi Arcjet với tham số fingerprint tùy chỉnh

        // PROTECT: Gọi Arcjet để kiểm tra request
        // "requested: 1" nghĩa là request này tốn 1 token
        const decision = await aj.protect(req, {
            // requested: 1,
            fingerprint: fingerprint // <--- ĐÂY LÀ CHÌA KHÓA
        });
        console.log(decision)
        // 1. Nếu Arcjet bị lỗi mạng (Deadline Exceeded)
        if (decision.isErrored()) {
            console.warn("[Arcjet] Check failed (Network/Timeout). Allowing request.");
            // Quan trọng: KHÔNG return lỗi, mà gọi next() để cho qua
            return next();
        }
        // Nếu bị từ chối (Denied)
        if (decision.isDenied()) {

            // Case 1: Bị chặn do Rate Limit (Spam nhiều quá)
            if (decision.reason.isRateLimit()) {
                console.warn(`[Arcjet] Rate limit exceeded for IP: ${req.ip}`);
                return res.status(429).json({
                    status: 'error',
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.',
                });
            }

            // Case 2: Bị chặn do phát hiện Bot
            if (decision.reason.isBot()) {
                console.warn(`[Arcjet] Bot detected: ${req.ip}`);
                return res.status(403).json({
                    status: 'error',
                    code: 'BOT_DETECTED',
                    message: 'Hệ thống phát hiện truy cập bất thường.'
                });
            }

            // Case 3: Bị chặn do tấn công (SQLi, XSS...) - Shield
            if (decision.reason.isShield()) {
                console.warn(`[Arcjet] Malicious traffic detected: ${req.ip}`);
                return res.status(403).json({
                    status: 'error',
                    code: 'ACCESS_DENIED',
                    message: 'Yêu cầu bị từ chối vì lý do bảo mật.'
                });
            }

            // Case mặc định
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Nếu an toàn -> Cho đi tiếp
        next();

    } catch (error) {
        // FAIL OPEN STRATEGY:
        // Nếu Arcjet bị lỗi (mất mạng, server down...), ta log lại nhưng VẪN CHO user đi tiếp.
        // Vì kinh doanh quan trọng hơn, không thể để user không mua hàng được chỉ vì tool bảo mật lỗi.
        console.error('[Arcjet] Error during protection check:', error);
        next();
    }
};