"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureFaceAdviceCollection = ensureFaceAdviceCollection;
exports.upsertFaceAdvicePoints = upsertFaceAdvicePoints;
exports.searchFaceAdvice = searchFaceAdvice;
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = __importDefault(require("axios"));
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const FACE_ADVICE_COLLECTION = process.env.QDRANT_COLLECTION_FACE_ADVICE || "face_advice_embeddings";
// const FACE_ADVICE_VECTOR_SIZE = 1536; 
const FACE_ADVICE_VECTOR_SIZE = 1024;
async function ensureFaceAdviceCollection() {
    try {
        await axios_1.default.put(`${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}`, {
            vectors: {
                size: FACE_ADVICE_VECTOR_SIZE,
                distance: "Cosine", // Qdrant chấp nhận "Cosine"
            },
        }, {
            timeout: 10000,
        });
    }
    catch (error) {
        const err = error;
        if (err.response?.status === 409) {
            console.log("[qdrant] Collection already exists, skip creating");
            return;
        }
        // các lỗi khác vẫn throw
        throw err;
    }
}
async function upsertFaceAdvicePoints(points) {
    try {
        const res = await axios_1.default.put(`${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}/points`, { points }, { timeout: 20000 });
        console.log("[qdrant] Upsert points ok", res.data);
    }
    catch (error) {
        const err = error;
        console.error("[qdrant] Upsert error status:", err.response?.status);
        console.error("[qdrant] Upsert error data:", err.response?.data); // sẽ thấy message chi tiết
        throw err;
    }
}
/**
 * Search top K tư vấn theo vector query
 */
async function searchFaceAdvice(queryVector, topK = 5) {
    // await ensureFaceAdviceCollection();
    const res = await axios_1.default.post(`${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}/points/search`, {
        vector: queryVector,
        limit: topK,
        with_payload: true,
    }, { timeout: 15000 });
    const result = (res.data?.result || []).map((r) => ({
        id: r.id,
        score: r.score,
        payload: r.payload,
    }));
    return result;
}
