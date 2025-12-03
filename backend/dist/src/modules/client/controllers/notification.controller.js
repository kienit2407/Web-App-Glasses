"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNotificationController = exports.markAllRead = exports.markRead = exports.removeAll = exports.remove = exports.list = void 0;
const mongoose_1 = require("mongoose");
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const notification_service_1 = require("../services/notification.service");
// GET /notifications?page=&limit=
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { page = "1", limit = "20" } = req.query;
    const data = await notification_service_1.userNotificationService.listUserNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
    });
    return res.json({ data });
});
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await notification_service_1.userNotificationService.deleteOne(userId, id);
    return res.json({ data });
});
exports.removeAll = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id)
        throw new app_errol_1.BadRequestException("Unauthorized");
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await notification_service_1.userNotificationService.deleteAll(userId);
    return res.json({ data });
});
// PATCH /notifications/:id/read
exports.markRead = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const { id } = req.params;
    const data = await notification_service_1.userNotificationService.markRead(userId, id);
    return res.json({ data });
});
// PATCH /notifications/read-all
exports.markAllRead = (0, try_catch_1.TryCatch)(async (req, res) => {
    if (!req.user?._id) {
        throw new app_errol_1.BadRequestException("Unauthorized");
    }
    const userId = new mongoose_1.Types.ObjectId(req.user._id);
    const data = await notification_service_1.userNotificationService.markAllRead(userId);
    return res.json({ data });
});
exports.userNotificationController = {
    list: exports.list,
    markRead: exports.markRead,
    markAllRead: exports.markAllRead,
    remove: exports.remove,
    removeAll: exports.removeAll
};
