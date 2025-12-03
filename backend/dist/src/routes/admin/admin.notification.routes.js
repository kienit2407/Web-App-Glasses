"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_NOTIFICATION_ROUTES = void 0;
const express_1 = require("express");
const admin_notification_controller_1 = require("../../modules/admin/controllers/admin.notification.controller");
const router = (0, express_1.Router)();
// router.use(protectAdminRoute)
router.get("/", admin_notification_controller_1.adminNotificationController.list);
router.patch("/:id/read", admin_notification_controller_1.adminNotificationController.markRead);
router.patch("/read-all", admin_notification_controller_1.adminNotificationController.markAllRead);
router.delete("/:id", admin_notification_controller_1.adminNotificationController.remove);
router.delete("/", admin_notification_controller_1.adminNotificationController.removeAll);
exports.ADMIN_NOTIFICATION_ROUTES = router;
