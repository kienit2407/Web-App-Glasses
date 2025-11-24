// src/controllers/admin_users.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { BadRequestException } from "../../../utils/app_errol";
import { adminUsersService } from "../services/admin.user.service";
import { StatusCodes } from "http-status-codes";

// GET /admin/users?search=&page=&limit=&role=&is_active=
// GET /admin/users?search=&page=&limit=&role=&status=
export const list = TryCatch(async (req: Request, res: Response) => {
    const {
        search,
        page,
        limit,
        role,
        status,
        is_active, // fallback cũ, nếu FE đang dùng
    } = req.query as {
        search?: string;
        page?: string;
        limit?: string;
        role?: "user" | "admin";
        status?: "active" | "inactive" | "all";
        is_active?: string;
    };

    const data = await adminUsersService.list({
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        role,
        status: status ?? undefined,
        is_active:
            typeof is_active === "string"
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
export const detail = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await adminUsersService.detail(id);
    return res.json({ data: user });
});

// PATCH /admin/users/:id/status
// body: { is_active: boolean }
export const updateStatus = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
        throw new BadRequestException("is_active must be boolean");
    }

    const user = await adminUsersService.updateStatus(id, is_active);
    return res.json({ data: user });
});

// PATCH /admin/users/:id/role
// body: { is_admin: boolean } hoặc { roles: ["user","admin"] }
export const updateRole = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_admin, roles } = req.body;

    const user = await adminUsersService.updateRole(id, {
        roles,
        is_admin,
    });

    return res.json({ data: user });
});

// DELETE /admin/users/:id
// 👉 Giờ chỉ soft delete (set is_active=false), không xoá cứng.
export const remove = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await adminUsersService.remove(id);
    return res.json({ data: result });
});

// GET /admin/users/:id/login-history
export const getLoginHistory = TryCatch(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit } = req.query as {
        page?: string;
        limit?: string;
    };

    const data = await adminUsersService.getLoginHistory(id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });

    return res.json({ data });
});
// POST /admin/users
export const create = TryCatch(async (req: Request, res: Response) => {
    const { email, display_name, password, roles, is_active } = req.body;

    if (!email || !display_name || !password) {
        throw new BadRequestException("email, display_name, password are required");
    }

    const user = await adminUsersService.create({
        email,
        display_name,
        password,
        roles,
        is_active,
    });

    return res.status(StatusCodes.CREATED).json({ data: user });
});

export const adminUsersController = {
    list,
    create,
    detail,
    updateStatus,
    updateRole,
    remove,
    getLoginHistory,
};