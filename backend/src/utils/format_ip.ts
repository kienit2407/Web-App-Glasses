export const normalizeIp = (ip: string | null): string | null => {
    if (!ip) return null;

    // TH1: IPv6 localhost
    if (ip === "::1") {
        return "127.0.0.1";
    }
    // TH2: IPv4 được bọc trong IPv6, ví dụ ::ffff:127.0.0.1
    if (ip.startsWith("::ffff:")) {
        return ip.substring(7);
    }

    return ip;
}