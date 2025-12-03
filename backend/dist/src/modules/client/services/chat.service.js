"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyIntentWithLLM = classifyIntentWithLLM;
exports.detectIntentHybrid = detectIntentHybrid;
exports.condenseQuestion = condenseQuestion;
exports.detectIntent = detectIntent;
exports.chatWithCustomer = chatWithCustomer;
const llm_client_1 = require("../../../config/llm.client");
const product_service_1 = require("../../client/services/product.service");
const faceAdvice_service_1 = require("./faceAdvice.service");
async function classifyIntentWithLLM(message, recentHistory // Truyền thêm 1-2 câu lịch sử để hiểu ngữ cảnh
) {
    const systemPrompt = `
Bạn là AI Router của shop kính mắt. Nhiệm vụ duy nhất: Phân loại Intent.

ĐỊNH NGHĨA 4 LOẠI INTENT:
1. "order": 
   - Khách hỏi trạng thái đơn hàng (đang ở đâu, bao giờ giao).
   - Khách muốn đổi trả, bảo hành, khiếu nại về hàng ĐÃ MUA.
   - Khách hỏi về phương thức thanh toán cho đơn hàng ĐANG đặt.
   - KHÔNG bao gồm hỏi giá sản phẩm.

2. "product":
   - Khách hỏi giá, size, chất liệu, màu sắc của kính.
   - Khách hỏi "còn hàng không", "có mẫu này không".
   - Khách nhờ tìm kính (kính râm, gọng cận).
   - Khách hỏi chung chung "tư vấn đi" (nếu chưa rõ ngữ cảnh mua hàng).

3. "face_advice":
   - Khách mô tả khuôn mặt (tròn, vuông, dài) và hỏi hợp kính gì.
   - Khách hỏi kiến thức chọn kính.

4. "smalltalk":
   - Chào hỏi (hi, hello), cảm ơn, tạm biệt.
   - Các câu vô nghĩa hoặc không liên quan đến bán hàng (thời tiết, bóng đá).

VÍ DỤ PHÂN BIỆT KHÓ (Few-shot prompting):
- "Cái này giá sao?" -> product
- "Đơn của mình giá sao?" -> order
- "Tư vấn cho mình" (lịch sử trống) -> product
- "Mặt mình to quá tư vấn đi" -> face_advice
- "Shop ở đâu?" -> smalltalk (hoặc product tùy quy định, ở đây coi là smalltalk để bot trả lời địa chỉ)

OUTPUT FORMAT:
Chỉ trả về đúng 1 từ khóa: "order", "product", "face_advice", hoặc "smalltalk". Không giải thích thêm.
`;
    const userContent = `
Lịch sử chat gần nhất:
${recentHistory || "Không có"}

Câu khách hàng hiện tại:
"${message}"

-> Intent là:`;
    const response = await (0, llm_client_1.chatWithLlama)([
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
    ]);
    // Clean output để đảm bảo chỉ lấy từ khóa
    const rawIntent = response.trim().toLowerCase().replace(/['".]/g, "");
    // Validate lại xem có đúng 1 trong 4 loại không, nếu không fallback về product hoặc smalltalk
    const validIntents = ["order", "face_advice", "product", "smalltalk"];
    if (validIntents.includes(rawIntent)) {
        return rawIntent;
    }
    return "smalltalk"; // Fallback an toàn
}
async function detectIntentHybrid(message, history = []) {
    const lower = message.toLowerCase();
    // --- LỚP 1: HARD RULES (Bắt những cái chắc chắn 100%) ---
    // 1. Bắt mã đơn hàng (Regex cụ thể) -> Chắc chắn là Order
    if (lower.match(/od[-\s]?\d+/i) || lower.includes("đơn hàng của tôi")) {
        return "order";
    }
    // 2. Bắt các từ khóa tư vấn mặt quá rõ -> Chắc chắn là Face Advice
    // (Giữ lại logic cũ của bạn vì nó khá chuẩn)
    if (lower.includes("mặt tròn") || lower.includes("mặt vuông") ||
        lower.includes("mặt dài") || lower.includes("hợp với mặt")) {
        return "face_advice";
    }
    // --- LỚP 2: LLM CLASSIFIER (Xử lý những ca khó/mơ hồ) ---
    // Ví dụ khách nói: "Kiếm cho mình cái nào đeo đi biển cho ngầu"
    // -> Regex cũ có thể trượt vì không có chữ "kính".
    // -> LLM sẽ hiểu ngữ cảnh "đi biển", "ngầu" => Product.
    // Chuẩn bị context ngắn gọn cho LLM (lấy câu cuối của bot và user)
    const recentHistoryDocs = history.slice(-2).map(h => `${h.from}: ${h.content}`).join("\n");
    console.log("[Router] Regex failed/ambiguous, calling LLM...");
    const llmIntent = await classifyIntentWithLLM(message, recentHistoryDocs);
    return llmIntent;
}
function detectGenderPref(message) {
    const lower = message.toLowerCase();
    // một số pattern cơ bản, bạn có thể bổ sung tuỳ gu
    if (lower.includes("kính mát nam") ||
        lower.includes("kính nam") ||
        lower.includes("gọng nam") ||
        lower.includes("cho nam")) {
        return "male";
    }
    if (lower.includes("kính mát nữ") ||
        lower.includes("kính nữ") ||
        lower.includes("gọng nữ") ||
        lower.includes("cho nữ")) {
        return "female";
    }
    if (lower.includes("trẻ em") ||
        lower.includes("cho bé") ||
        lower.includes("kids")) {
        return "kids";
    }
    return null;
}
/* ================== 1. KEYWORD DETECTION ================== */
function hasFaceKeyword(text) {
    return (text.includes("mặt tròn") ||
        text.includes("mặt vuông") ||
        text.includes("mặt trái tim") ||
        text.includes("mặt dài") ||
        text.includes("mặt oval") ||
        text.includes("khuôn mặt") ||
        (text.includes("mặt") && text.includes("tròn")) ||
        (text.includes("mặt") && text.includes("vuông")));
}
function hasOrderKeyword(text) {
    return (text.includes("đơn hàng") ||
        text.includes("mã đơn") ||
        text.includes("theo dõi đơn") ||
        !!text.match(/od[-\s]?\d+/i));
}
function hasProductKeyword(text) {
    return (text.includes("kính") ||
        text.includes("gọng") ||
        text.includes("kính mát") ||
        text.includes("kính râm") ||
        text.includes("tròng") ||
        text.includes("mua kính") ||
        text.includes("mua gọng") ||
        text.includes("giá kính") ||
        text.includes("giá gọng") ||
        text.includes("size") ||
        text.includes("sản phẩm") ||
        text.includes("gợi ý sản phẩm"));
}
/* ================== 2. CONDENSE QUESTION (CHỈ DÙNG CHO FACE_ADVICE / SAU NÀY) ================== */
async function condenseQuestion(message, history = []) {
    const recentHistory = history.slice(-6);
    const historyText = recentHistory
        .map((h) => `${h.from === "user" ? "User" : "Bot"}: ${h.content}`)
        .join("\n");
    const system = {
        role: "system",
        content: `
Bạn là trợ lý giúp CHUẨN HÓA CÂU HỎI.

NHIỆM VỤ:
- Đọc lịch sử hội thoại và câu hỏi cuối của khách.
- Viết lại câu hỏi cuối thành MỘT câu hỏi độc lập, đầy đủ ngữ cảnh.
- Giữ ngôn ngữ tiếng Việt, không thêm lời chào, không trả lời nội dung.
- Chỉ trả về đúng câu hỏi đã được viết lại.`,
    };
    const user = {
        role: "user",
        content: `Lịch sử hội thoại (nếu có):
${historyText || "[Trống]"}

Câu hỏi cuối của khách:
"${message}"

==> Hãy viết lại thành MỘT câu hỏi độc lập:`,
    };
    const rewritten = await (0, llm_client_1.chatWithLlama)([system, user]);
    console.log("[chat] condensed question:", rewritten);
    return rewritten.trim();
}
function mapHistoryToMessages(history) {
    return history.map((turn) => ({
        role: turn.from === "user" ? "user" : "assistant",
        content: turn.content,
    }));
}
function extractBudgetFromMessage(message) {
    const lower = message.toLowerCase();
    // "5 củ", "5 cu"
    const cuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(củ|cu)\b/);
    if (cuMatch) {
        const num = parseFloat(cuMatch[1].replace(",", "."));
        if (!isNaN(num))
            return Math.round(num * 1000000);
    }
    // "5 triệu", "4.5tr", "5m"
    const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)\b/);
    if (millionMatch) {
        const num = parseFloat(millionMatch[1].replace(",", "."));
        if (!isNaN(num))
            return Math.round(num * 1000000);
    }
    // "500k", "200 nghìn", "200 ngàn"
    const kMatch = lower.match(/(\d+)\s*(k|nghìn|ngàn)\b/);
    if (kMatch) {
        const num = parseInt(kMatch[1], 10);
        if (!isNaN(num))
            return num * 1000;
    }
    // số >= 4 chữ số → coi là VND (vd: "100000")
    const plainNumber = lower.match(/\b(\d{4,})\b/);
    if (plainNumber) {
        const num = parseInt(plainNumber[1], 10);
        if (!isNaN(num))
            return num;
    }
    return null;
}
function detectUsageContext(message) {
    const lower = message.toLowerCase();
    if (lower.includes("biển") ||
        lower.includes("ra nắng") ||
        lower.includes("tắm biển") ||
        lower.includes("du lịch")) {
        return "beach";
    }
    if (lower.includes("văn phòng") ||
        lower.includes("đi làm") ||
        lower.includes("công sở")) {
        return "office";
    }
    if (lower.includes("đi học") ||
        lower.includes("sinh viên") ||
        lower.includes("học bài")) {
        return "study";
    }
    if (lower.includes("chạy bộ") ||
        lower.includes("thể thao") ||
        lower.includes("đi xe") ||
        lower.includes("phượt")) {
        return "sport";
    }
    return null;
}
function detectProductKind(message) {
    const lower = message.toLowerCase();
    if (lower.includes("kính mát") ||
        lower.includes("kính râm") ||
        lower.includes("đi biển") ||
        lower.includes("ra nắng")) {
        return "sunglasses";
    }
    if (lower.includes("gọng") || lower.includes("gọng kính")) {
        return "frame";
    }
    return null;
}
// Suy loại sản phẩm từ câu hiện tại + history
function inferProductKind(message, history = []) {
    // 1. Thử đoán từ câu hiện tại
    const now = detectProductKind(message);
    if (now)
        return now;
    // 2. Nếu không có, quay ngược history tìm câu user gần nhất có nói rõ
    const lastUserKind = [...history]
        .reverse()
        .filter((h) => h.from === "user")
        .map((h) => detectProductKind(h.content))
        .find((k) => k !== null);
    return lastUserKind ?? null;
}
// Dự phòng cho tương lai (hỏi "còn hàng không") – hiện chưa dùng đến
function isGenericAvailabilityQuestion(message) {
    const lower = message.toLowerCase();
    return (lower.includes("còn hàng không") ||
        lower.includes("còn không") ||
        lower.includes("hết hàng chưa") ||
        lower.includes("có sẵn không"));
}
function detectIntent(message, history = []) {
    const lower = message.toLowerCase();
    const budget = extractBudgetFromMessage(message);
    const face = hasFaceKeyword(lower);
    const order = hasOrderKeyword(lower);
    const product = hasProductKeyword(lower);
    const avail = isGenericAvailabilityQuestion(lower); // NEW
    // ƯU TIÊN KEYWORD TRƯỚC
    if (face)
        return "face_advice";
    if (order)
        return "order";
    if (product)
        return "product";
    if (product || avail)
        return "product";
    // Không có keyword nhưng CÓ tiền → suy từ history
    if (budget !== null) {
        const lastUserTurn = [...history].reverse().find((h) => h.from === "user");
        const lastUserText = lastUserTurn?.content.toLowerCase() ?? "";
        if (hasFaceKeyword(lastUserText))
            return "face_advice";
        if (hasOrderKeyword(lastUserText))
            return "order";
        if (hasProductKeyword(lastUserText))
            return "product";
        // Mặc định: có tiền mà không có context gì khác => coi là hỏi SẢN PHẨM
        return "product";
    }
    return "smalltalk";
}
// function kindLabel(kind: ProductKind | null): string {
//   if (kind === "sunglasses") return "kính mát";
//   if (kind === "frame") return "gọng kính";
//   return "kính mắt";
// }
/* ================== 0. SYSTEM PERSONA (TÍNH CÁCH BOT) ================== */
// Định nghĩa tính cách ở 1 chỗ để đồng bộ giọng điệu
const BOT_PERSONA = `
Bạn là trợ lý ảo của shop kính mắt (tên Shop). 
Tính cách: Thân thiện, nhiệt tình, chuyên nghiệp nhưng gần gũi (dùng từ 'mình', 'shop', 'bạn').
Phong cách trả lời: Ngắn gọn, đi thẳng vào vấn đề, sử dụng emoji nhẹ nhàng.
`;
/* ================== 1. HANDLER: FACE ADVICE (RAG + CONTEXT) ================== */
async function handleFaceAdvice(message, history) {
    // BƯỚC 1: Query Transformation (Quan trọng cho UX)
    // Nếu khách hỏi "Còn mặt tròn thì sao?", ta cần đổi thành "Mặt tròn nên đeo kính gì?"
    let searchPixel = message;
    if (history.length > 0) {
        searchPixel = await condenseQuestion(message, history);
    }
    // BƯỚC 2: Retrieve (Tìm kiếm Vector)
    const { docs, topScore } = await (0, faceAdvice_service_1.searchFaceAdvice)(searchPixel, 3);
    // Kiểm tra độ liên quan (Threshold)
    const isRelevant = docs.length > 0 && (topScore ?? 0) >= 0.55;
    let ragContext = "";
    if (isRelevant) {
        ragContext = docs
            .map((d, i) => `[Kiến thức ${i + 1}]: ${d.title}\nNội dung: ${d.content}`)
            .join("\n\n");
    }
    // BƯỚC 3: Generate (Sinh câu trả lời)
    const systemPrompt = `
${BOT_PERSONA}
NHIỆM VỤ: Tư vấn chọn kính dựa trên kiến thức được cung cấp.

KIẾN THỨC NỀN (RAG):
${ragContext || "Không tìm thấy tài liệu cụ thể, hãy trả lời dựa trên kiến thức chung về kính mắt."}

YÊU CẦU:
- Giải thích tại sao kiểu kính đó hợp với khuôn mặt.
- Gợi ý dáng kính cụ thể (vuông, tròn, mắt mèo...).
- KHÔNG bịa đặt tên sản phẩm cụ thể nếu không có trong context.
- Cuối câu hỏi gợi mở: "Bạn có muốn shop gợi ý một vài mẫu [dáng kính gợi ý] đang có sẵn không?"
`;
    const messages = [
        { role: "system", content: systemPrompt },
        ...mapHistoryToMessages(history), // Vẫn giữ history để LLM nắm mạch chuyện
        { role: "user", content: message } // Dùng message gốc của user để tự nhiên
    ];
    return await (0, llm_client_1.chatWithLlama)(messages);
}
/* ================== 2. HANDLER: PRODUCT SEARCH (LOGIC + LLM GENERATION) ================== */
async function handleProductSearch(message, history) {
    // 1. Trích xuất thông tin
    const budget = extractBudgetFromMessage(message);
    const usage = detectUsageContext(message);
    const kind = inferProductKind(message, history);
    const gender = detectGenderPref(message);
    const isLookingForMore = message.toLowerCase().includes("hơn") || message.toLowerCase().includes("trên");
    // Nếu khách nói "hơn 300k", ta tạm thời bỏ maxBudget để tìm rộng hơn, 
    // hoặc nhân đôi budget lên để query database (cách hack đơn giản).
    // Ở đây mình chọn cách: Nếu "hơn", không truyền maxBudget vào service, để service trả về nhiều mức giá, sau đó để LLM lọc.
    const searchBudget = isLookingForMore ? undefined : (budget ?? undefined);
    // 2. Gọi Service
    let items = [];
    // Ưu tiên tìm theo Context
    if (kind) {
        const res = await product_service_1.productService.getContextRecommendations({
            keywordContext: kind,
            maxBudget: searchBudget, // Dùng budget đã điều chỉnh
            genderPref: gender ?? undefined,
            limit: 8 // Lấy nhiều hơn chút để lọc
        });
        items = res.items;
    }
    // Fallback
    if (items.length === 0) {
        // Nếu không tìm thấy theo kind, tìm chung chung
        const res = await product_service_1.productService.getBudgetRecommendations({
            maxBudget: searchBudget,
            limit: 8
        });
        items = res.items;
    }
    // --- FIX 1: LỌC TRÙNG SẢN PHẨM (QUAN TRỌNG) ---
    // Dùng Map để lọc các sản phẩm có cùng product_id
    const uniqueItems = Array.from(new Map(items.map(item => [item.product_id, item])).values());
    // Chỉ lấy 5 món tốt nhất sau khi lọc
    const finalItems = uniqueItems.slice(0, 5);
    console.log(`[ProductHandler] Found ${finalItems.length} unique items.`);
    // --- FIX 2: XỬ LÝ KHI DANH SÁCH RỖNG ---
    if (finalItems.length === 0) {
        const systemPromptEmpty = `
${BOT_PERSONA}
TÌNH HUỐNG: Khách hỏi mua kính nhưng hệ thống KHÔNG tìm thấy sản phẩm nào phù hợp.
NHIỆM VỤ: Xin lỗi khéo léo và gợi ý khách xem tất cả sản phẩm tại website.
TUYỆT ĐỐI KHÔNG BỊA SẢN PHẨM.
`;
        return await (0, llm_client_1.chatWithLlama)([
            { role: "system", content: systemPromptEmpty },
            ...mapHistoryToMessages(history),
            { role: "user", content: message }
        ]);
    }
    // --- FIX 3: CONTEXT CHO LLM ---
    const productContext = finalItems.map(p => `- Tên: ${p.product_name} | Giá: ${p.price.toLocaleString("vi-VN")}đ | Link: /${p.slug}`).join("\n");
    const usageNote = usage === "beach" ? "Ưu tiên kính râm, chống UV." : "";
    // Prompt được update để xử lý vấn đề giá
    const systemPrompt = `
${BOT_PERSONA}
NHIỆM VỤ: Tư vấn bán hàng dựa trên danh sách sản phẩm có thật.

THÔNG TIN KHÁCH HÀNG:
- Ngân sách mong muốn: ${budget ? budget.toLocaleString("vi-VN") + "đ" : "Chưa rõ"} ${isLookingForMore ? "(Khách muốn tìm giá CAO HƠN mức này)" : ""}
- Nhu cầu: ${usage || "Chưa rõ"}

DANH SÁCH SẢN PHẨM CÓ SẴN (JSON):
${productContext}

QUY TẮC TRẢ LỜI:
1. So sánh giá trong danh sách với ngân sách khách:
   - Nếu tìm thấy món đúng tầm giá khách cần: Giới thiệu nhiệt tình.
   - Nếu CHỈ tìm thấy món giá rẻ hơn hoặc đắt hơn nhiều: Hãy nói thật. Ví dụ: "Dạ tầm giá trên 300k shop đang tạm hết, nhưng shop có mẫu này giá 123k cũng rất xịn, bạn xem thử nhé". -> KHÔNG ĐƯỢC NÓI DỐI LÀ NÓ PHÙ HỢP NGÂN SÁCH NẾU GIÁ SAI QUÁ NHIỀU.
2. KHÔNG lặp lại tên sản phẩm giống nhau.
3. KHÔNG bịa sản phẩm ngoài danh sách.
4. Không đưa link trực tiếp, chỉ gợi ý tên sản phẩm và giá.
5. Kết thúc bằng câu hỏi gợi mở để khuyến khích khách phản hồi.
6. Sử dụng emoji nhẹ nhàng để tăng tính thân thiện.
7. Giữ phong cách tự nhiên, không quá cứng nhắc như robot.
8. Nếu có yêu cầu đặc biệt (kính nam/nữ/trẻ em), hãy nhấn mạnh điều đó khi giới thiệu sản phẩm.
9. Nếu không có sản phẩm phù hợp với ngân sách, hãy đề xuất khách xem toàn bộ sản phẩm tại website của shop.
10. Luôn nhắc khách rằng shop có hỗ trợ tư vấn thêm nếu cần.
11. Liệt kê thành 1., 2., 3. nếu có nhiều sản phẩm và xuống dòng rõ ràng. Để khách dễ đọc.
12. Chú ý${usageNote} gợi ý sản phẩm phù hợp với nhu cầu sử dụng của khách.
`;
    const messages = [
        { role: "system", content: systemPrompt },
        ...mapHistoryToMessages(history),
        { role: "user", content: message }
    ];
    return await (0, llm_client_1.chatWithLlama)(messages);
}
async function handleGeneral(intent, message, history) {
    let specificInstruction = "";
    if (intent === "order") {
        specificInstruction = `
    - Nhiệm vụ: Hỗ trợ kiểm tra đơn hàng.
    - Quy tắc: Nếu khách đưa mã đơn, hãy nói shop sẽ kiểm tra ngay. Nếu chưa đưa, hãy xin mã đơn. 
    - Chưa kết nối DB đơn hàng thực tế, nên hãy hướng dẫn khách chat với nhân viên thật nếu cần gấp.
    `;
    }
    else {
        specificInstruction = `
    - Nhiệm vụ: Trò chuyện xã giao (Smalltalk).
    - Quy tắc: Nếu khách hỏi ngoài lề (bóng đá, chính trị...), từ chối lịch sự và lái về kính mắt.
    `;
    }
    const messages = [
        { role: "system", content: `${BOT_PERSONA}\n${specificInstruction}` },
        ...mapHistoryToMessages(history),
        { role: "user", content: message }
    ];
    return await (0, llm_client_1.chatWithLlama)(messages);
}
/* ================== MAIN CONTROLLER ================== */
async function chatWithCustomer(message, history = []) {
    console.log(`[Chat] User: "${message}"`);
    // 1. Detect Intent (Dùng hàm Hybrid bạn đã viết)
    const intent = await detectIntentHybrid(message, history);
    console.log(`[Chat] Intent Detected: ${intent}`);
    let answer = "";
    // 2. Route to Handler
    switch (intent) {
        case "face_advice":
            answer = await handleFaceAdvice(message, history);
            break;
        case "product":
            answer = await handleProductSearch(message, history);
            break;
        case "order":
        case "smalltalk":
            answer = await handleGeneral(intent, message, history);
            break;
        default:
            answer = "Xin lỗi, shop chưa hiểu ý bạn lắm. Bạn cần tìm kính hay tư vấn gì ạ?";
    }
    return { intent, answer };
}
