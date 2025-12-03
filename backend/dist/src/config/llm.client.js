"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithLlama = chatWithLlama;
exports.embedTexts = embedTexts;
exports.embedQuery = embedQuery;
// src/config/llm.client.ts
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const axios_1 = __importDefault(require("axios"));
const groqClient = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-large-2-instruct";
if (!VOYAGE_API_KEY) {
    console.warn("[LLM] VOYAGE_API_KEY is not set");
}
if (!process.env.GROQ_CHAT_MODEL) {
    console.warn("[LLM] GROQ_CHAT_MODEL is not set");
}
async function chatWithLlama(messages) {
    const model = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";
    const completion = await groqClient.chat.completions.create({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 512,
    });
    const answer = completion.choices[0]?.message?.content?.trim() || "Xin lỗi, mình chưa trả lời được.";
    return answer;
}
/**
 * Embed một list text (dùng cho index FAQ / face advice)
 */
async function embedTexts(texts) {
    if (!VOYAGE_API_KEY) {
        throw new Error("VOYAGE_API_KEY is missing");
    }
    const res = await axios_1.default.post(VOYAGE_API_URL, {
        model: VOYAGE_EMBEDDING_MODEL,
        input: texts,
        input_type: "document", // vì đây là nội dung knowledge
    }, {
        headers: {
            Authorization: `Bearer ${VOYAGE_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    // Voyage trả về embeddings dạng { data: [{ embedding: number[] }, ...] } 
    const vectors = res.data.data.map((item) => item.embedding);
    return vectors;
}
/**
 * Embed câu hỏi người dùng (query)
 */
async function embedQuery(text) {
    if (!VOYAGE_API_KEY) {
        throw new Error("VOYAGE_API_KEY is missing");
    }
    const res = await axios_1.default.post(VOYAGE_API_URL, {
        model: VOYAGE_EMBEDDING_MODEL,
        input: [text],
        input_type: "query", // query của user
    }, {
        headers: {
            Authorization: `Bearer ${VOYAGE_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    const vector = res.data.data[0].embedding;
    return vector;
}
