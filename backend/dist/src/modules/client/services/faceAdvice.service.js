"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexFaceAdviceToQdrant = indexFaceAdviceToQdrant;
exports.searchFaceAdvice = searchFaceAdvice;
// src/modules/face-advice/faceAdvice.service.ts
const llm_client_1 = require("../../../config/llm.client");
const qdrant_client_1 = require("../../../config/qdrant_client");
const crypto_1 = require("crypto");
const faceAdvice_docs_1 = require("../../../utils/faceAdvice.docs");
const COLLECTION = process.env.QDRANT_COLLECTION_FACE_ADVICE ||
    "face_advice_embeddings";
/**
 * Chạy 1 lần để tạo collection + index dữ liệu tư vấn khuôn mặt vào Qdrant
 */
async function indexFaceAdviceToQdrant() {
    // đảm bảo collection tồn tại
    await (0, qdrant_client_1.ensureFaceAdviceCollection)();
    // 1. Embed toàn bộ docs
    // QUAN TRỌNG: Nối cả Title + Keywords + Content để tạo vector phong phú ngữ nghĩa
    const texts = faceAdvice_docs_1.FACE_ADVICE_DOCS.map((doc) => `
Title: ${doc.title}
Keywords: ${doc.keywords.join(", ")}
Content: ${doc.content}
        `.trim());
    console.log("[face-advice] Embedding", texts.length, "docs...");
    const vectors = await (0, llm_client_1.embedTexts)(texts);
    // 2. Upsert vào Qdrant
    await (0, qdrant_client_1.upsertFaceAdvicePoints)(faceAdvice_docs_1.FACE_ADVICE_DOCS.map((doc, idx) => ({
        id: (0, crypto_1.randomUUID)(),
        vector: vectors[idx],
        payload: {
            original_id: doc.id,
            title: doc.title,
            content: doc.content,
            face_shape: doc.face_shape,
            keywords: doc.keywords, // <--- Lưu thêm keywords vào payload để tiện debug/hiển thị
            type: "face_advice",
        },
    })));
    console.log("[face-advice] Indexed", faceAdvice_docs_1.FACE_ADVICE_DOCS.length, "docs to Qdrant");
}
/**
 * Search RAG face advice
 */
async function searchFaceAdvice(query, limit = 3) {
    const queryVector = await (0, llm_client_1.embedQuery)(query);
    const raw = await (0, qdrant_client_1.searchFaceAdvice)(queryVector, limit);
    if (!raw || raw.length === 0) {
        return {
            docs: [],
            bestFaceShape: null,
            topScore: null,
        };
    }
    // Map lại kết quả từ Qdrant về object FaceAdviceDoc
    const docs = raw.map((r) => ({
        id: r.payload.original_id ?? String(r.id),
        title: r.payload.title,
        content: r.payload.content,
        face_shape: r.payload.face_shape,
        keywords: r.payload.keywords ?? [], // <--- Lấy lại keywords từ payload
    }));
    const topScore = raw[0].score ?? null;
    const bestFaceShape = raw[0].payload?.face_shape ??
        (docs[0]?.face_shape ?? null);
    return { docs, bestFaceShape, topScore };
}
