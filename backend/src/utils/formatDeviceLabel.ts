// Helper: format chuỗi thiết bị cho gọn gàng
export const formatDeviceLabel = (raw: string | null) => {
    if (!raw) {
        return "N/A";
    }

    // raw dạng: "web | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ... Chrome/141.0.0.0 Safari/537.36"
    const [platformRaw, uaRaw] = raw.split("|");
    const platform = (platformRaw || "").trim().toLowerCase();
    const ua = (uaRaw || "").trim();

    // Platform label
    let platformLabel = "Khác";
    if (platform === "web") platformLabel = "Web";
    else if (platform === "mobile") platformLabel = "Mobile";

    // OS
    let os = "";
    if (/Windows NT/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

    // Browser
    let browser = "";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome\//i.test(ua)) browser = "Chrome";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";

    // Ghép chuỗi gọn gàng
    // Ví dụ: "Web • Chrome trên macOS"
    let parts: string[] = [];
    if (platformLabel) parts.push(platformLabel);
    if (browser) parts.push(browser);
    if (os) parts.push(`trên ${os}`);

    if (!parts.length) {
        // fallback: cắt ngắn UA
        return raw.length > 40 ? raw.slice(0, 40) + "..." : raw;
    }

    return parts.join(" • ");
};
