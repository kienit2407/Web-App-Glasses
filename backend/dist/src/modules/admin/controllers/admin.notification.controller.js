"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminNotificationController = exports.markAllRead = exports.markRead = exports.removeAll = exports.remove = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const admin_notification_service_1 = require("../services/admin.notification.service");
// GET /admin/notifications?page=&limit=
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    // đã có protectAdminRoute ở router
    const { page = "1", limit = "20" } = req.query;
    const data = await admin_notification_service_1.adminNotificationService.listAdminNotifications({
        page: Number(page),
        limit: Number(limit),
    });
    return res.json({ data });
});
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const data = await admin_notification_service_1.adminNotificationService.deleteOne(id);
    return res.json({ data });
});
exports.removeAll = (0, try_catch_1.TryCatch)(async (_req, res) => {
    const data = await admin_notification_service_1.adminNotificationService.deleteAll();
    return res.json({ data });
});
exports.markRead = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const data = await admin_notification_service_1.adminNotificationService.markRead(id);
    return res.json({ data });
});
exports.markAllRead = (0, try_catch_1.TryCatch)(async (_req, res) => {
    const data = await admin_notification_service_1.adminNotificationService.markAllRead();
    return res.json({ data });
});
exports.adminNotificationController = {
    list: exports.list,
    remove: exports.remove,
    removeAll: exports.removeAll,
    markRead: exports.markRead,
    markAllRead: exports.markAllRead
};
