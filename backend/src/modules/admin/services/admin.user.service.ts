// src/service/admin_users.service.ts
import { Types } from "mongoose";
import { User, IUser } from "../../../models/user.model";
import AppError, { BadRequestException, NotFoundException } from "../../../utils/app_errol";
import { LoginHistory } from "../../../models/login_history.model";
import bcrypt from "bcryptjs"
type Role = "user" | "admin";

interface ListUsersParams {
    search?: string;
    page?: number;
    limit?: number;
    role?: Role;
    is_active?: boolean;
    status?: UserStatus;
}
// THÊM: payload tạo user thủ công từ admin
interface CreateUserPayload {
    email: string;
    display_name: string;
    password: string;
    roles?: Role[];        // optional, default = ['user']
    is_active?: boolean;   // optional, default = true
}
interface ListLoginHistoryParams {
    page?: number;
    limit?: number;
}
type UserStatus = "active" | "inactive" | "all";
export const adminUsersService = {
    /**
     * List user cho admin: search + phân trang + filter role / status
     * status = "active" | "inactive" | "all"
     */
    async list(params: ListUsersParams) {
        const {
            search,
            page = 1,
            limit = 20,
            role,
            is_active, // cũ
            status = "active", // mặc định tab Đang hoạt động
        } = params;

        const filter: any = {};

        // Search theo email / display_name
        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [{ email: regex }, { display_name: regex }];
        }

        // Filter theo status (ưu tiên status, nếu FE dùng)
        if (status === "active") {
            filter.is_active = true;
        } else if (status === "inactive") {
            filter.is_active = false;
        } else if (typeof is_active === "boolean") {
            // fallback nếu FE đang dùng is_active
            filter.is_active = is_active;
        }

        // Filter theo role
        if (role) {
            filter.roles = role;
        }

        const pageNum = page > 0 ? page : 1;
        const limitNum = limit > 0 ? limit : 20;
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            User.find(filter)
                // không trả password
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limitNum) || 1;

        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        };
    },
    /**
     * TẠO USER THỦ CÔNG CHO ADMIN
     */
    async create(payload: CreateUserPayload) {
        const { email, display_name, password, roles, is_active } = payload;

        if (!email || !display_name || !password) {
            throw new BadRequestException("email, display_name, password are required");
        }

        const existed = await User.findOne({ email });
        if (existed) {
            throw new BadRequestException("Email đã được đăng ký");
        }

        const salt = await bcrypt.genSalt(10);
        const hashed_pwd = await bcrypt.hash(password, salt);

        // mới: chỉ giữ đúng 1 role, ưu tiên cái đầu tiên FE gửi
        let finalRoles: Role[] = ["user"];

        if (Array.isArray(roles) && roles.length > 0) {
            const firstRole = roles[0]; // "user" | "admin"
            finalRoles = [firstRole];
        }

        const doc = await User.create({
            email,
            display_name: display_name.trim(),
            password: hashed_pwd,
            roles: finalRoles,
            is_active: typeof is_active === "boolean" ? is_active : true,
        });

        const plain = doc.toObject();
        delete (plain as any).password;

        return plain;
    },



    /**
     * Update trạng thái is_active
     * Có check: nếu user là admin cuối cùng thì không cho deactivate
     */
    async updateStatus(userId: string, is_active: boolean) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException("Invalid user id");
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const isAdmin = user.roles?.includes("admin");

        if (isAdmin && is_active === false) {
            // Đếm số admin đang active
            const activeAdminCount = await User.countDocuments({
                roles: "admin",
                is_active: true,
            });

            if (activeAdminCount <= 1) {
                throw new BadRequestException(
                    "Cannot deactivate the last active admin"
                );
            }
        }

        user.is_active = is_active;
        await user.save();

        const plain = user.toObject();
        delete (plain as any).password;
        return plain;
    },

    /**
     * Update role của user.
     * FE có thể gửi roles[] hoặc đơn giản gửi is_admin boolean.
     */
    async updateRole(userId: string, payload: { roles?: Role[]; is_admin?: boolean }) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        let newRoles: Role[];

        if (payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
            // CHỈ 1 role duy nhất
            const firstRole = payload.roles[0]; // "user" | "admin"
            newRoles = [firstRole];
        } else if (typeof payload.is_admin === "boolean") {
            // support kiểu body: { is_admin: true/false }
            newRoles = [payload.is_admin ? "admin" : "user"];
        } else {
            throw new BadRequestException("roles[] or is_admin is required");
        }

        const wasAdmin = user.roles.includes("admin");
        const willBeAdmin = newRoles.includes("admin");

        // Nếu đang là admin -> bị mất quyền admin -> check không được làm admin cuối cùng mất quyền
        if (wasAdmin && !willBeAdmin) {
            const activeAdminCount = await User.countDocuments({
                roles: "admin",
                is_active: true,
            });

            if (activeAdminCount <= 1) {
                throw new BadRequestException("Cannot remove role admin from the last active admin");
            }
        }

        user.roles = newRoles;
        await user.save();

        const plain = user.toObject();
        delete (plain as any).password;
        return plain;
    },

    /**
     * "Xoá" user:
     * 👉 Theo yêu cầu của bạn: KHÔNG xoá cứng, chỉ set is_active = false (soft delete).
     * Vẫn giữ rule: không được disable admin cuối cùng.
     */
    async remove(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException("Invalid user id");
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Nếu đã ngừng hoạt động rồi thì coi như xoá mềm rồi
        if (!user.is_active) {
            return { success: true, softDeleted: true };
        }

        const isAdmin = user.roles.includes("admin");

        if (isAdmin) {
            const activeAdminCount = await User.countDocuments({
                roles: "admin",
                is_active: true,
            });

            if (activeAdminCount <= 1) {
                throw new BadRequestException(
                    "Cannot delete (deactivate) the last active admin"
                );
            }
        }

        user.is_active = false;
        await user.save();

        return { success: true, softDeleted: true };
    },
    /**
    * Lấy chi tiết 1 user
    */
    async detail(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException("Invalid user id");
        }

        const user = await User.findById(userId).select("-password").lean();

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return user;
    },
    /**
     * Lấy lịch sử đăng nhập của 1 user (cho Drawer)
     */
    async getLoginHistory(userId: string, params: ListLoginHistoryParams) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException("Invalid user id");
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const page = params.page && params.page > 0 ? params.page : 1;
        const limit = params.limit && params.limit > 0 ? params.limit : 10;
        const skip = (page - 1) * limit;

        const filter = { user_id: user._id };

        const [items, total] = await Promise.all([
            LoginHistory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LoginHistory.countDocuments(filter),
        ]);

        const mapped = items.map((h) => ({
            id: String(h._id),
            platform: h.platform,
            device: h.device,
            ip: h.ip,
            user_agent: h.user_agent,
            atTime: h.createdAt,
        }));

        return {
            user: {
                id: String(user._id),
                email: user.email,
                display_name: user.display_name,
            },
            items: mapped,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};