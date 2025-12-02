/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const FACE_ADVICE_COLLECTION =
    process.env.QDRANT_COLLECTION_FACE_ADVICE || "face_advice_embeddings";


// const FACE_ADVICE_VECTOR_SIZE = 1536; 
const FACE_ADVICE_VECTOR_SIZE = 1024;


export async function ensureFaceAdviceCollection() {
    try {
        await axios.put(
            `${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}`,
            {
                vectors: {
                    size: FACE_ADVICE_VECTOR_SIZE,
                    distance: "Cosine", // Qdrant chấp nhận "Cosine"
                },
            },
            {
                timeout: 10000,
            }
        );
    } catch (error) {
        const err = error as AxiosError<any>;

        if (err.response?.status === 409) {
            console.log("[qdrant] Collection already exists, skip creating");
            return;
        }

        // các lỗi khác vẫn throw
        throw err;
    }
}

export async function upsertFaceAdvicePoints(points: any[]) {
    try {
        const res = await axios.put(
            `${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}/points`,
            { points },
            { timeout: 20000 }
        );
        console.log("[qdrant] Upsert points ok", res.data);
    } catch (error) {
        const err = error as AxiosError<any>;
        console.error("[qdrant] Upsert error status:", err.response?.status);
        console.error("[qdrant] Upsert error data:", err.response?.data); // sẽ thấy message chi tiết
        throw err;
    }
}

/**
 * Search top K tư vấn theo vector query
 */
export async function searchFaceAdvice(
    queryVector: number[],
    topK = 5
): Promise<
    {
        id: string | number;
        score: number;
        payload: any;
    }[]
> {
    // await ensureFaceAdviceCollection();

    const res = await axios.post(
        `${QDRANT_URL}/collections/${FACE_ADVICE_COLLECTION}/points/search`,
        {
            vector: queryVector,
            limit: topK,
            with_payload: true,
        },
        { timeout: 15000 }
    );

    const result = (res.data?.result || []).map((r: any) => ({
        id: r.id,
        score: r.score,
        payload: r.payload,
    }));

    return result;
}
