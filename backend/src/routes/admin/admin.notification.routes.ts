import { Router } from "express"
import { adminNotificationController } from "../../modules/admin/controllers/admin.notification.controller"

const router = Router()

// router.use(protectAdminRoute)

router.get("/", adminNotificationController.list);
router.patch("/:id/read", adminNotificationController.markRead);
router.patch("/read-all", adminNotificationController.markAllRead);
router.delete("/:id", adminNotificationController.remove);
router.delete("/", adminNotificationController.removeAll);
export const ADMIN_NOTIFICATION_ROUTES = router
