"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.virtualTryOnController = void 0;
const virtualTryOn_service_1 = require("../services/virtualTryOn.service");
const promises_1 = __importDefault(require("fs/promises"));
exports.virtualTryOnController = {
    async create(req, res) {
        try {
            const files = req.files;
            const faceFile = files?.face?.[0];
            const glassesFile = files?.glasses?.[0];
            if (!faceFile || !glassesFile) {
                return res
                    .status(400)
                    .json({ message: "Thiếu ảnh khuôn mặt hoặc ảnh kính" });
            }
            // Hỗ trợ cả memoryStorage lẫn diskStorage
            const faceBuffer = faceFile.buffer && faceFile.buffer.length > 0
                ? faceFile.buffer
                : await promises_1.default.readFile(faceFile.path);
            const glassesBuffer = glassesFile.buffer && glassesFile.buffer.length > 0
                ? glassesFile.buffer
                : await promises_1.default.readFile(glassesFile.path);
            const result = await virtualTryOn_service_1.virtualTryOnService.generate({
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
        }
        catch (err) {
            console.error("virtual-tryon error:", err?.message || err);
            return res.status(500).json({
                message: "Lỗi khi xử lý thử kính ảo",
                error: err?.message,
            });
        }
    },
};
