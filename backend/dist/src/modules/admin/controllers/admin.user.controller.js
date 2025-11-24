"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersController = exports.create = exports.getLoginHistory = exports.remove = exports.updateRole = exports.updateStatus = exports.detail = exports.list = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const app_errol_1 = require("../../../utils/app_errol");
const admin_user_service_1 = require("../services/admin.user.service");
const http_status_codes_1 = require("http-status-codes");
// GET /admin/users?search=&page=&limit=&role=&is_active=
// GET /admin/users?search=&page=&limit=&role=&status=
exports.list = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { search, page, limit, role, status, is_active, // fallback cũ, nếu FE đang dùng
     } = req.query;
    const data = await admin_user_service_1.adminUsersService.list({
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        role,
        status: status ?? undefined,
        is_active: typeof is_active === "string"
            ? is_active === "true"
                ? true
                : is_active === "false"
                    ? false
                    : undefined
            : undefined,
    });
    return res.json({ data });
});
// GET /admin/users/:id
exports.detail = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const user = await admin_user_service_1.adminUsersService.detail(id);
    return res.json({ data: user });
});
// PATCH /admin/users/:id/status
// body: { is_active: boolean }
exports.updateStatus = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
        throw new app_errol_1.BadRequestException("is_active must be boolean");
    }
    const user = await admin_user_service_1.adminUsersService.updateStatus(id, is_active);
    return res.json({ data: user });
});
// PATCH /admin/users/:id/role
// body: { is_admin: boolean } hoặc { roles: ["user","admin"] }
exports.updateRole = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const { is_admin, roles } = req.body;
    const user = await admin_user_service_1.adminUsersService.updateRole(id, {
        roles,
        is_admin,
    });
    return res.json({ data: user });
});
// DELETE /admin/users/:id
// 👉 Giờ chỉ soft delete (set is_active=false), không xoá cứng.
exports.remove = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const result = await admin_user_service_1.adminUsersService.remove(id);
    return res.json({ data: result });
});
// GET /admin/users/:id/login-history
exports.getLoginHistory = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const data = await admin_user_service_1.adminUsersService.getLoginHistory(id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    return res.json({ data });
});
// POST /admin/users
exports.create = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { email, display_name, password, roles, is_active } = req.body;
    if (!email || !display_name || !password) {
        throw new app_errol_1.BadRequestException("email, display_name, password are required");
    }
    const user = await admin_user_service_1.adminUsersService.create({
        email,
        display_name,
        password,
        roles,
        is_active,
    });
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({ data: user });
});
exports.adminUsersController = {
    list: exports.list,
    create: exports.create,
    detail: exports.detail,
    updateStatus: exports.updateStatus,
    updateRole: exports.updateRole,
    remove: exports.remove,
    getLoginHistory: exports.getLoginHistory,
};
