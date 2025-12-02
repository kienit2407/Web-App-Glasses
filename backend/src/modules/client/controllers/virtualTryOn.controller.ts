// src/modules/virtual-tryon/virtualTryOn.controller.ts
import { Request, Response } from "express";
import { virtualTryOnService } from "../services/virtualTryOn.service";
import fs from "fs/promises";

type MulterFiles = {
    face?: Express.Multer.File[];
    glasses?: Express.Multer.File[];
};

export const virtualTryOnController = {
    async create(req: Request, res: Response) {
        try {
            const files = req.files as MulterFiles;

            const faceFile = files?.face?.[0];
            const glassesFile = files?.glasses?.[0];

            if (!faceFile || !glassesFile) {
                return res
                    .status(400)
                    .json({ message: "Thiếu ảnh khuôn mặt hoặc ảnh kính" });
            }

            // Hỗ trợ cả memoryStorage lẫn diskStorage
            const faceBuffer =
                faceFile.buffer && faceFile.buffer.length > 0
                    ? faceFile.buffer
                    : await fs.readFile(faceFile.path);

            const glassesBuffer =
                glassesFile.buffer && glassesFile.buffer.length > 0
                    ? glassesFile.buffer
                    : await fs.readFile(glassesFile.path);

            const result = await virtualTryOnService.generate({
                faceBuffer,
                faceMime: faceFile.mimetype,
                glassesBuffer,
                glassesMime: glassesFile.mimetype,
            });

            return res.json({
                message: "OK",
                data: {
                    imageBase64: result.imageBase64,
                    mimeType: result.mimeType,
                },
            });
        } catch (err: any) {
            console.error("virtual-tryon error:", err?.message || err);
            return res.status(500).json({
                message: "Lỗi khi xử lý thử kính ảo",
                error: err?.message,
            });
        }
    },
};
