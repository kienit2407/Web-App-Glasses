import { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { supportUserController } from "../modules/client/controllers/support.controller";
import { uploadMiddlewares } from "../middleware/upload.middlewares";


const router = Router();

router.use(authMidleWares.protectUserRoute);
router.post(
    "/messages/media",
    uploadMiddlewares.upload.single("file"),
    supportUserController.sendMediaMessage
);
// POST /support/messages  (gửi tin mới hoặc tiếp tục cuộc cũ)
router.post("/messages", supportUserController.sendMessage);

// GET /support/conversations
router.get("/conversations", supportUserController.listMyConversations);

// GET /support/conversations/:id/messages
router.get("/conversations/:id/messages", supportUserController.listMyMessages);

export const SUPPORT_ROUTES = router;
