// src/modules/face-advice/faceAdvice.service.ts
import { embedQuery, embedTexts } from "../../../config/llm.client";
import {
    ensureFaceAdviceCollection,
    upsertFaceAdvicePoints,
    searchFaceAdvice as searchFaceAdviceVector,
} from "../../../config/qdrant_client";


import { randomUUID } from "crypto";
import { FACE_ADVICE_DOCS, FaceAdviceDoc } from "../../../utils/faceAdvice.docs";

const COLLECTION =
    process.env.QDRANT_COLLECTION_FACE_ADVICE ||
    "face_advice_embeddings";

/**
 * Chạy 1 lần để tạo collection + index dữ liệu tư vấn khuôn mặt vào Qdrant
 */
export async function indexFaceAdviceToQdrant() {
    // đảm bảo collection tồn tại
    await ensureFaceAdviceCollection();

    // 1. Embed toàn bộ docs
    // QUAN TRỌNG: Nối cả Title + Keywords + Content để tạo vector phong phú ngữ nghĩa
    const texts = FACE_ADVICE_DOCS.map(
        (doc) => `
Title: ${doc.title}
Keywords: ${doc.keywords.join(", ")}
Content: ${doc.content}
        `.trim()
    );

    console.log("[face-advice] Embedding", texts.length, "docs...");
    const vectors = await embedTexts(texts);

    // 2. Upsert vào Qdrant
    await upsertFaceAdvicePoints(
        FACE_ADVICE_DOCS.map((doc, idx) => ({
            id: randomUUID(),
            vector: vectors[idx],
            payload: {
                original_id: doc.id,
                title: doc.title,
                content: doc.content,
                face_shape: doc.face_shape,
                keywords: doc.keywords, // <--- Lưu thêm keywords vào payload để tiện debug/hiển thị
                type: "face_advice",
            },
        })),
    );

    console.log(
        "[face-advice] Indexed",
        FACE_ADVICE_DOCS.length,
        "docs to Qdrant",
    );
}

export interface FaceAdviceSearchResult {
    docs: FaceAdviceDoc[];
    bestFaceShape: FaceAdviceDoc["face_shape"] | null;
    topScore: number | null;
}

/**
 * Search RAG face advice
 */
export async function searchFaceAdvice(
    query: string,
    limit = 3,
): Promise<FaceAdviceSearchResult> {
    const queryVector = await embedQuery(query);
    const raw = await searchFaceAdviceVector(queryVector, limit);

    if (!raw || raw.length === 0) {
        return {
            docs: [],
            bestFaceShape: null,
            topScore: null,
        };
    }

    // Map lại kết quả từ Qdrant về object FaceAdviceDoc
    const docs: FaceAdviceDoc[] = raw.map((r) => {
        // 1. Lấy payload ra và ép kiểu về any để truy cập thuộc tính dễ dàng
        const payload = r.payload as any;

        return {
            // Dùng ?? "" để đảm bảo luôn là string, không bị null/undefined
            id: (payload?.original_id as string) ?? String(r.id),
            title: (payload?.title as string) ?? "",
            content: (payload?.content as string) ?? "",

            // 2. QUAN TRỌNG: Ép kiểu string về Union Type ("round" | "square"...)
            face_shape: (payload?.face_shape as FaceAdviceDoc["face_shape"]) ?? "oval", // Giá trị mặc định nếu không tìm thấy

            keywords: (payload?.keywords as string[]) ?? [],
        };
    });

    const topScore = raw[0].score ?? null;

    // Sửa lại đoạn này một chút cho an toàn
    const firstPayload = raw[0].payload as any;
    const bestFaceShape =
        (firstPayload?.face_shape as FaceAdviceDoc["face_shape"]) ??
        (docs[0]?.face_shape ?? null);

    return { docs, bestFaceShape, topScore };
}