import arcjet, { shield, detectBot, tokenBucket, slidingWindow, validateEmail } from "@arcjet/node";

// Định nghĩa các Rules
const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    // characteristics: Định danh người dùng. 
    // Mặc định là IP ("ip.src"). Trong môi trường Mobile/CGNAT, IP có thể bị trùng.
    // Ở level cao, ta sẽ override cái này trong Middleware (xem Bước 3).
    characteristics: ["ip.src"],
    
    rules: [
        // 1. SHIELD: Tương đương WAF (Web Application Firewall)
        // Bảo vệ khỏi SQL Injection, XSS, v.v.
        shield({
            mode: "DRY_RUN"
        }),

        // 2. BOT DETECTION: Chống tool auto
        detectBot({
            mode: process.env.NODE_BUILD === "dev" ? "DRY_RUN" : "LIVE",
            // Cho phép các bot xịn (Google, Bing) để SEO web, chặn tất cả bot khác (curl, python script...)
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR"],
        }),

        // 3. RATE LIMITING (Global Protection)
        // Token Bucket: Phù hợp cho API stream hoặc hành vi người dùng liên tục
        // tokenBucket({
        //     mode: process.env.NODE_BUILD === "dev" ? "DRY_RUN" : "LIVE",
        //     refillRate: 20, // Thêm 10 tokens mỗi interval
        //     interval: 10,   // Mỗi 10 giây
        //     characteristics: ['fingerprint'],
        //     capacity: 40,   // Max burst là 20 requests
        // }),
        slidingWindow({
            mode: process.env.NODE_BUILD === "dev" ? "DRY_RUN" : "LIVE",
            interval: 60, // Tính trong khung thời gian 60 giây
            max: 100,     // Cho phép gọi tối đa 100 lần trong 60 giây đó
            characteristics: ['fingerprint'],
        }),
    ],
});

export default aj;
// 2. Instance chuyên check Email (Chỉ dùng cho hàm SignUp)
export const ajEmail = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        validateEmail({
            mode: process.env.NODE_BUILD === "dev" ? "DRY_RUN" : "LIVE",
            // Chặn email dùng 1 lần (10minutemail), email sai cú pháp, domain không có MX record
            block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
        }),
    ],
});