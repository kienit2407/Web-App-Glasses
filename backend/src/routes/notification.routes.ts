import { Router } from "express"
import { userNotificationController } from "../modules/client/controllers/notification.controller"
import { authMidleWares } from "../middleware/authMiddleware"


const router = Router()

router.use(authMidleWares.protectUserRoute)

router.get("/", userNotificationController.list)
router.patch("/:id/read", userNotificationController.markRead)
router.patch("/read-all", userNotificationController.markAllRead)
router.delete("/:id", userNotificationController.remove)
router.delete("/", userNotificationController.removeAll)

export const NOTIFICATION_ROUTES = router