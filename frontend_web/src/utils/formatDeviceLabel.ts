export const formatDeviceLabel = (raw: string | null) => {
    if (!raw) return "N/A";

    let platformRaw: string;
    let ua: string;

    if (raw.includes(" | ")) {
        const parts = raw.split(" | ");
        platformRaw = (parts[0] || "").trim();
        ua = (parts[1] || "").trim();
    } else {
        ua = raw.trim();
        platformRaw = "web";
    }

    const platform = platformRaw.toLowerCase();

    let platformLabel = "Khác";
    if (platform === "web") platformLabel = "Web";
    else if (platform === "mobile") platformLabel = "Mobile";

    // SPECIAL CASE: Flutter / Dart mobile app
    if (/dart\/\d+/i.test(ua)) {
        // bạn có thể đoán OS nếu sau này UA có Android/iOS
        return platform === "mobile" ? "Mobile App" : "Web";
    }

    // OS
    let os = "";
    if (/Windows NT/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    // Browser
    let browser = "";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/Edg\//i.test(ua))
        browser = "Safari";
    else if (/MSIE|Trident/i.test(ua)) browser = "IE";

    const parts: string[] = [];
    if (platformLabel) parts.push(platformLabel);
    if (browser) parts.push(browser);
    if (os) parts.push(`trên ${os}`);

    if (parts.length === 0) {
        return raw.length > 40 ? raw.slice(0, 40) + "..." : raw;
    }

    return parts.join(" • ");
};
