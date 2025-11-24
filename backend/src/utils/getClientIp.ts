import { Request } from "express";

export const getClientIp = (req: Request) => {
    const xff = (req.headers["x-forwarded-for"] as string) || "";
    return xff.split(",")[0].trim() || req.socket.remoteAddress || "";
};