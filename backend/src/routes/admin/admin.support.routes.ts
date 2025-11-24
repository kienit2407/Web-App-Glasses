import { Router } from "express";
import { authMidleWares } from "../../middleware/authMiddleware";
import { supportAdminController } from "../../modules/admin/controllers/admin.support.controller";
import { uploadMiddlewares } from "../../middleware/upload.middlewares";


const router = Router();

router.use(authMidleWares.protectUserRoute);

// GET /admin/support/conversations
router.get("/conversations", supportAdminController.listConversations);

// GET /admin/support/conversations/:id/messages
router.get("/conversations/:id/messages", supportAdminController.listMessages);
router.post(
    "/conversations/:id/media",
    uploadMiddlewares.upload.single("file"),
    supportAdminController.sendAdminMediaMessage
);
// POST /admin/support/conversations/:id/messages
router.post("/conversations/:id/messages", supportAdminController.sendAdminMessage);

// PATCH /admin/support/conversations/:id/close
router.patch("/conversations/:id/close", supportAdminController.closeConversation);

router.delete("/conversations/:id", supportAdminController.deleteConversation);
export const ADMIN_SUPPORT_ROUTES = router;
