// src/routes/chat.routes.ts
import { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { chatController } from "../modules/client/controllers/chat.controller";

const router = Router();

// nếu muốn cho cả khách chưa đăng nhập xài bot thì bỏ middleware này đi
// router.use(authMidleWares.protectUserRoute);

router.post("/chat", chatController.chat);

export const CHAT_ROUTES = router;
