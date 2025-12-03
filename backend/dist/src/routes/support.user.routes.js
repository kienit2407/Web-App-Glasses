"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORT_ROUTES = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const support_controller_1 = require("../modules/client/controllers/support.controller");
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.post("/messages/media", upload_middlewares_1.uploadMiddlewares.upload.single("file"), support_controller_1.supportUserController.sendMediaMessage);
// POST /support/messages  (gửi tin mới hoặc tiếp tục cuộc cũ)
router.post("/messages", support_controller_1.supportUserController.sendMessage);
// GET /support/conversations
router.get("/conversations", support_controller_1.supportUserController.listMyConversations);
// GET /support/conversations/:id/messages
router.get("/conversations/:id/messages", support_controller_1.supportUserController.listMyMessages);
exports.SUPPORT_ROUTES = router;
