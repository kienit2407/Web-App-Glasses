// src/middleware/uploadMiddlewares.ts
import multer, { FileFilterCallback } from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb: FileFilterCallback) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/webm",
        ];

        if (!allowed.includes(file.mimetype)) {
            const err = new Error(
                "Invalid file type. Only JPG/PNG/WebP or MP4/MOV/WEBM allowed"
            );
            // TS ok vì cb nhận Error | null
            return cb(err);
            // hoặc: return cb(err as any);
        }

        cb(null, true);
    },
});

export const uploadMiddlewares = {
    upload,
};
