import { QdrantClient } from "@qdrant/js-client-rest";

// Khởi tạo Client (Tự động xử lý Token nếu có)
const client = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY, // Nếu local không có thì để undefined nó vẫn chạy
});

const FACE_ADVICE_COLLECTION = process.env.QDRANT_COLLECTION_FACE_ADVICE || "face_advice_embeddings";
const FACE_ADVICE_VECTOR_SIZE = 1024;

export async function ensureFaceAdviceCollection() {
    try {
        // Kiểm tra xem collection tồn tại chưa
        const result = await client.getCollections();
        const exists = result.collections.find((c) => c.name === FACE_ADVICE_COLLECTION);

        if (!exists) {
            await client.createCollection(FACE_ADVICE_COLLECTION, {
                vectors: {
                    size: FACE_ADVICE_VECTOR_SIZE,
                    distance: "Cosine",
                },
            });
            console.log("[qdrant] Created collection:", FACE_ADVICE_COLLECTION);
        } else {
            console.log("[qdrant] Collection exists, skipping.");
        }
    } catch (error) {
        console.error("[qdrant] Ensure collection error:", error);
        throw error;
    }
}

export async function upsertFaceAdvicePoints(points: any[]) {
    try {
        // Thư viện hỗ trợ hàm upsert trực tiếp, không cần nhớ URL
        const res = await client.upsert(FACE_ADVICE_COLLECTION, {
            points: points,
        });
        console.log("[qdrant] Upsert status:", res.status);
    } catch (error) {
        console.error("[qdrant] Upsert error:", error);
        throw error;
    }
}

export async function searchFaceAdvice(queryVector: number[], topK = 5) {
    try {
        const res = await client.search(FACE_ADVICE_COLLECTION, {
            vector: queryVector,
            limit: topK,
            with_payload: true,
        });

        // Kết quả trả về đã chuẩn format, không cần map nhiều
        return res.map((r) => ({
            id: r.id,
            score: r.score,
            payload: r.payload,
        }));
    } catch (error) {
        console.error("[qdrant] Search error:", error);
        return [];
    }
}