"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_ROUTES = void 0;
// src/routes/chat.routes.ts
const express_1 = require("express");
const chat_controller_1 = require("../modules/client/controllers/chat.controller");
const router = (0, express_1.Router)();
// nếu muốn cho cả khách chưa đăng nhập xài bot thì bỏ middleware này đi
// router.use(authMidleWares.protectUserRoute);
router.post("/chat", chat_controller_1.chatController.chat);
exports.CHAT_ROUTES = router;
