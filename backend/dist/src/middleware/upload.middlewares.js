"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddlewares = void 0;
// src/middleware/uploadMiddlewares.ts
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/webm",
        ];
        if (!allowed.includes(file.mimetype)) {
            const err = new Error("Invalid file type. Only JPG/PNG/WebP or MP4/MOV/WEBM allowed");
            // TS ok vì cb nhận Error | null
            return cb(err);
            // hoặc: return cb(err as any);
        }
        cb(null, true);
    },
});
exports.uploadMiddlewares = {
    upload,
};
