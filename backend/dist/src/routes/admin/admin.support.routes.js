"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_SUPPORT_ROUTES = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const admin_support_controller_1 = require("../../modules/admin/controllers/admin.support.controller");
const upload_middlewares_1 = require("../../middleware/upload.middlewares");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// GET /admin/support/conversations
router.get("/conversations", admin_support_controller_1.supportAdminController.listConversations);
// GET /admin/support/conversations/:id/messages
router.get("/conversations/:id/messages", admin_support_controller_1.supportAdminController.listMessages);
router.post("/conversations/:id/media", upload_middlewares_1.uploadMiddlewares.upload.single("file"), admin_support_controller_1.supportAdminController.sendAdminMediaMessage);
// POST /admin/support/conversations/:id/messages
router.post("/conversations/:id/messages", admin_support_controller_1.supportAdminController.sendAdminMessage);
// PATCH /admin/support/conversations/:id/close
router.patch("/conversations/:id/close", admin_support_controller_1.supportAdminController.closeConversation);
router.delete("/conversations/:id", admin_support_controller_1.supportAdminController.deleteConversation);
exports.ADMIN_SUPPORT_ROUTES = router;
