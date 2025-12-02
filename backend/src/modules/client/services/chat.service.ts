import { ChatMessage, chatWithLlama } from "../../../config/llm.client";
import { productService } from "../../client/services/product.service";
import { searchFaceAdvice } from "../../face-advice/service/faceAdvice.service";

export type ChatIntent = "order" | "product" | "face_advice" | "smalltalk";

export type ChatHistoryTurn = {
  from: "user" | "bot";
  content: string;
};

export type ChatResponse = {
  intent: ChatIntent;
  answer: string;
};



function hasFaceKeyword(text: string): boolean {
  return (
    text.includes("mặt tròn") ||
    text.includes("mặt vuông") ||
    text.includes("mặt trái tim") ||
    text.includes("mặt dài") ||
    text.includes("mặt oval") ||
    text.includes("khuôn mặt") ||
    (text.includes("mặt") && text.includes("tròn")) ||
    (text.includes("mặt") && text.includes("vuông"))
  );
}

function hasOrderKeyword(text: string): boolean {
  return (
    text.includes("đơn hàng") ||
    text.includes("mã đơn") ||
    text.includes("theo dõi đơn") ||
    !!text.match(/od[-\s]?\d+/i)
  );
}

function hasProductKeyword(text: string): boolean {
  return (
    text.includes("kính") ||
    text.includes("gọng") ||
    text.includes("kính mát") ||
    text.includes("tròng") ||
    text.includes("mua kính") ||
    text.includes("mua gọng") ||
    text.includes("giá kính") ||
    text.includes("giá gọng") ||
    text.includes("size")
  );
}

function mapHistoryToMessages(history: ChatHistoryTurn[]): ChatMessage[] {
  return history.map((turn) => ({
    role: turn.from === "user" ? "user" : "assistant",
    content: turn.content,
  }));
}



function extractBudgetFromMessage(message: string): number | null {
  const lower = message.toLowerCase();

  // "5 củ", "5 cu"
  const cuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(củ|cu)\b/);
  if (cuMatch) {
    const num = parseFloat(cuMatch[1].replace(",", "."));
    if (!isNaN(num)) return Math.round(num * 1_000_000);
  }

  // "5 triệu", "4.5tr", "5m"
  const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)\b/);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(",", "."));
    if (!isNaN(num)) return Math.round(num * 1_000_000);
  }

  // "500k", "200 nghìn", "200 ngàn"
  const kMatch = lower.match(/(\d+)\s*(k|nghìn|ngàn)\b/);
  if (kMatch) {
    const num = parseInt(kMatch[1], 10);
    if (!isNaN(num)) return num * 1_000;
  }

  // số >= 4 chữ số → coi là VND (vd: "100000")
  const plainNumber = lower.match(/\b(\d{4,})\b/);
  if (plainNumber) {
    const num = parseInt(plainNumber[1], 10);
    if (!isNaN(num)) return num;
  }

  return null;
}



type UsageContext = "beach" | "office" | "study" | "sport" | null;

function detectUsageContext(message: string): UsageContext {
  const lower = message.toLowerCase();

  if (
    lower.includes("biển") ||
    lower.includes("ra nắng") ||
    lower.includes("tắm biển") ||
    lower.includes("du lịch")
  ) {
    return "beach";
  }

  if (
    lower.includes("văn phòng") ||
    lower.includes("đi làm") ||
    lower.includes("công sở")
  ) {
    return "office";
  }

  if (
    lower.includes("đi học") ||
    lower.includes("sinh viên") ||
    lower.includes("học bài")
  ) {
    return "study";
  }

  if (
    lower.includes("chạy bộ") ||
    lower.includes("thể thao") ||
    lower.includes("đi xe") ||
    lower.includes("phượt")
  ) {
    return "sport";
  }

  return null;
}

type ProductKind = "sunglasses" | "frame" | null;

function detectProductKind(message: string): ProductKind {
  const lower = message.toLowerCase();

  if (
    lower.includes("kính mát") ||
    lower.includes("kính râm") ||
    lower.includes("đi biển") ||
    lower.includes("ra nắng")
  ) {
    return "sunglasses";
  }

  if (lower.includes("gọng") || lower.includes("gọng kính")) {
    return "frame";
  }

  return null;
}



export function detectIntent(
  message: string,
  history: ChatHistoryTurn[] = [],
): ChatIntent {
  const lower = message.toLowerCase();
  const budget = extractBudgetFromMessage(message);

  const face = hasFaceKeyword(lower);
  const order = hasOrderKeyword(lower);
  const product = hasProductKeyword(lower);

  // ƯU TIÊN KEYWORD TRƯỚC
  if (face) return "face_advice";
  if (order) return "order";
  if (product) return "product";

  // Không có keyword nhưng CÓ tiền → suy từ history
  if (budget !== null) {
    const lastUserTurn = [...history].reverse().find((h) => h.from === "user");
    const lastUserText = lastUserTurn?.content.toLowerCase() ?? "";

    if (hasFaceKeyword(lastUserText)) return "face_advice";
    if (hasOrderKeyword(lastUserText)) return "order";
    if (hasProductKeyword(lastUserText)) return "product";

    // Mặc định: có tiền mà không có context gì khác => coi là hỏi SẢN PHẨM
    return "product";
  }

  return "smalltalk";
}

type SimpleProduct = {
  product_id: string;
  product_name: string;
  slug: string;
  price: number;
  thumbnail_url: string | null;
};

function buildProductAnswerFromItems(params: {
  budget: number | null;
  usage: UsageContext;
  items: SimpleProduct[];
}): string {
  const { budget, usage, items } = params;
  const hasProducts = items.length > 0;

  const budgetText =
    budget != null ? `${budget.toLocaleString("vi-VN")} đồng` : null;

  let prefix = "";

  if (budgetText && hasProducts) {
    prefix = `Trong tầm khoảng ${budgetText}, shop đang có một số mẫu kính mắt phù hợp.`;
  } else if (budgetText && !hasProducts) {
    prefix = `Trong tầm khoảng ${budgetText}, hiện shop chưa có nhiều mẫu kính phù hợp.`;
  } else if (!budgetText && hasProducts) {
    prefix = `Shop đang có một số mẫu kính mắt phù hợp với nhu cầu của bạn.`;
  } else {
    prefix =
      "Hiện tại shop có khá nhiều mẫu kính mắt với nhiều mức giá khác nhau.";
  }

  let usagePart = "";
  switch (usage) {
    case "beach":
      usagePart =
        " Với nhu cầu hay đi biển/ra nắng, shop khuyên bạn ưu tiên kính mát có tròng chống UV400, nếu được có thêm tròng phân cực (polarized) để giảm chói. Gọng nên nhẹ, bền, ôm mặt để đeo lâu không bị khó chịu.";
      break;
    case "office":
      usagePart =
        " Nếu chủ yếu đeo đi làm/văn phòng, bạn nên chọn gọng nhẹ, form basic, dễ phối đồ. Nếu hay dùng máy tính có thể ưu tiên tròng hỗ trợ giảm ánh sáng xanh.";
      break;
    case "study":
      usagePart =
        " Nếu đeo đi học, nên chọn gọng nhẹ, chắc, form đơn giản, đeo cả ngày không bị nặng mặt.";
      break;
    case "sport":
      usagePart =
        " Nếu dùng khi chơi thể thao/đi xe, nên chọn kính nhẹ, ôm sát mặt, tròng khó vỡ và hạn chế chói để nhìn đường rõ hơn.";
      break;
    default:
      usagePart = "";
  }

  let productPart = "";
  if (hasProducts) {
    const top = items.slice(0, 3); // show tối đa 3 mẫu cho gọn
    const lines = top.map(
      (p, idx) =>
        `${idx + 1}. ${p.product_name} ~ ${p.price.toLocaleString(
          "vi-VN",
        )}đ`,
    );

    productPart =
      "\n\nMột vài gợi ý trong tầm giá từ sản phẩm thật của shop:\n" +
      lines.join("\n");
  }

  let closing = "";
  if (hasProducts) {
    closing =
      "\n\nBạn có thể xem thêm chi tiết ở trang sản phẩm hoặc nhắn admin nếu cần tư vấn kỹ hơn nhé.";
  } else if (budgetText) {
    closing =
      "\n\nBạn thử giúp shop điều chỉnh lại khoảng giá một chút hoặc nhắn admin để được tư vấn thêm nhé.";
  } else {
    closing =
      "\n\nBạn có thể cho shop xin thêm thông tin về ngân sách để shop gợi ý sát hơn nha.";
  }

  return (prefix + usagePart + productPart + closing).trim();
}



export async function chatWithCustomer(
  message: string,
  history: ChatHistoryTurn[] = [],
): Promise<ChatResponse> {
  const intent = detectIntent(message, history);
  console.log("[chat] intent:", intent, "message:", message, "history:", history);

  const historyMessages = mapHistoryToMessages(history);


  if (intent === "face_advice") {
    const budget = extractBudgetFromMessage(message);

    const { docs, bestFaceShape, topScore } = await searchFaceAdvice(message, 3);
    const hasGoodRag = docs.length > 0 && (topScore ?? 0) >= 0.55;

    let ragContext = "";
    if (hasGoodRag) {
      ragContext = docs
        .map(
          (d, idx) =>
            `# Gợi ý ${idx + 1}: ${d.title}\n${d.content}`,
        )
        .join("\n\n");
    }

    const systemContent = `
Bạn là chuyên gia tư vấn kính mắt cho khách hàng Việt Nam của một shop ONLINE.

CONTEXT TỪ TÀI LIỆU RAG (có thể trống nếu không tìm được gì phù hợp):
${ragContext || "[Không có context RAG]"}

QUY TẮC RẤT QUAN TRỌNG:
- Chỉ trả lời các câu hỏi liên quan đến kính mắt, gọng kính, phong cách, khuôn mặt, đơn hàng hoặc chính sách của shop.
- KHÔNG được nêu tên sản phẩm cụ thể, mã sản phẩm, giá cụ thể.
- Website sẽ tự hiển thị danh sách gọng kính phù hợp ở bên dưới (nếu có), bạn chỉ cần tư vấn kiểu dáng, chất liệu, phong cách.
- Với câu hỏi về khuôn mặt, hãy:
  + Giải thích vì sao kiểu kính đó hợp với khuôn mặt.
  + Có thể gợi ý thêm 1–2 kiểu gọng chung chung (vd: gọng vuông, tròn, mắt mèo...) để khách tham khảo.
- Trả lời ngắn gọn, dễ hiểu, thân thiện, xưng "shop".
`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const answer = await chatWithLlama(messages);
    return { intent, answer };
  }



  if (intent === "product") {
    const budget = extractBudgetFromMessage(message);
    const usage = detectUsageContext(message);
    const kind = detectProductKind(message);

    let items: SimpleProduct[] = [];

    // Ưu tiên: nếu biết user nói về kính mát / gọng → dùng getContextRecommendations
    if (kind !== null) {
      const rec = await productService.getContextRecommendations({
        keywordContext: kind,
        maxBudget: budget ?? undefined,
        limit: 6,
      });
      items = rec.items;
    }

    // Nếu chưa tìm được gì theo context hoặc không có context → fallback theo ngân sách chung
    if ((!items || items.length === 0) && budget != null) {
      const rec2 = await productService.getBudgetRecommendations({
        maxBudget: budget,
        limit: 6,
      });
      items = rec2.items;
    }

    // Nếu vẫn không có (hoặc không có budget) → có thể lấy top bán chạy (không filter giá)
    if ((!items || items.length === 0) && budget == null) {
      const rec3 = await productService.getBudgetRecommendations({
        // không truyền maxBudget → lấy theo bán chạy
        limit: 6,
      });
      items = rec3.items;
    }

    console.log(
      "[chat][product] budget =",
      budget,
      "usage =",
      usage,
      "kind =",
      kind,
      "items.length =",
      items.length,
    );

    const answer = buildProductAnswerFromItems({
      budget,
      usage,
      items,
    });

    return { intent, answer };
  }

  /* ---------- 3. ORDER ---------- */

  if (intent === "order") {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `
Bạn là chatbot hỗ trợ kiểm tra đơn hàng cho khách.

QUY TẮC:
- Chỉ trả lời về: đơn hàng, tình trạng giao hàng, thanh toán, đổi trả.
- Hiện tại CHƯA nối trực tiếp với database đơn hàng.
- Khi khách hỏi chi tiết trạng thái đơn, hãy hướng dẫn:
  "Anh/chị gửi giúp shop mã đơn hoặc nhắn trực tiếp cho admin để kiểm tra chi tiết nhé."
- Không trả lời các câu hỏi ngoài phạm vi (bóng đá, lập trình, chính trị...).
- Trả lời thân thiện, ngắn gọn, xưng "shop".
`,
      },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const answer = await chatWithLlama(messages);
    return { intent, answer };
  }

  /* ---------- 4. SMALLTALK / FAQ CHUNG ---------- */

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `
Bạn là chatbot hỗ trợ khách hàng của một shop kính mắt.

QUY TẮC:
- Chỉ trả lời trong phạm vi: kính mắt, bảo hành, đổi trả, cách chọn kính theo khuôn mặt, cách bảo quản kính, đơn hàng của shop.
- Nếu người dùng hỏi về chủ đề khác (ví dụ: bóng đá, Ronaldo mấy quả bóng vàng, toán học, lập trình...), hãy từ chối và nói:
  "Shop chỉ hỗ trợ các vấn đề liên quan đến kính mắt và đơn hàng, mình không trả lời được câu hỏi này ạ."
- Trả lời thân thiện, ngắn gọn, tiếng Việt.
`,
    },
    ...historyMessages,
    { role: "user", content: message },
  ];

  const answer = await chatWithLlama(messages);
  return { intent, answer };
}
