// src/modules/virtual-tryon/virtualTryOn.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Nếu sau này bạn confirm SDK hỗ trợ 1.5 thì đổi lại
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-vision" });
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function bufferToBase64(buffer: Buffer) {
    return buffer.toString("base64");
}

export type VirtualTryOnResult = {
    imageBase64: string;
    mimeType: string;
};

export const virtualTryOnService = {
    async generate(params: {
        faceBuffer: Buffer;
        faceMime: string;
        glassesBuffer: Buffer;
        glassesMime: string;
    }): Promise<VirtualTryOnResult> {
        const { faceBuffer, faceMime, glassesBuffer, glassesMime } = params;

        const faceBase64 = bufferToBase64(faceBuffer);
        const glassesBase64 = bufferToBase64(glassesBuffer);

        const prompt = `
Bạn là model chỉnh sửa ảnh. Nhiệm vụ:
- Dùng ảnh khuôn mặt người dùng làm ảnh nền.
- Dùng ảnh kính làm mẫu gọng kính.
- Ghép kính lên khuôn mặt sao cho:
  + Kính đeo đúng vị trí mắt.
  + Giữ tỉ lệ kính hợp lý với khuôn mặt.
  + Giữ lại tone da, tóc, background gốc càng nhiều càng tốt.
- Phong cách thực tế (realistic), không vẽ thêm chi tiết lạ.
- Chỉ trả về một ảnh duy nhất là kết quả (không cần text).

Ảnh thứ nhất: khuôn mặt người dùng.
Ảnh thứ hai: mẫu kính.
`;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    data: faceBase64,
                    mimeType: faceMime,
                },
            },
            {
                inlineData: {
                    data: glassesBase64,
                    mimeType: glassesMime,
                },
            },
        ]);

        const response = result.response as any;
        const imgPart = response.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData
        );

        if (!imgPart?.inlineData?.data) {
            throw new Error("Gemini không trả về ảnh");
        }

        const imageBase64: string = imgPart.inlineData.data;
        const mimeType: string = imgPart.inlineData.mimeType || "image/png";

        return { imageBase64, mimeType };
    },
};
