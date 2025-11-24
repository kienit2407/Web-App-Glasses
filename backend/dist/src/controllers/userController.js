"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getAllUsers = exports.getMe = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// GET /api/users/me
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id).select("-passwordHash");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getMe = getMe;
// GET /api/users/user
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find({ role: "user" }).select("-passwordHash");
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllUsers = getAllUsers;
// POST /api/users/user
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role = "user", status = "active" } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already exists" });
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = new User_1.default({
            firstName,
            lastName,
            email,
            passwordHash,
            role,
            status,
        });
        if (req.file) {
            newUser.avatar = `/uploads/${req.file.filename}`;
        }
        await newUser.save();
        res.status(201).json({
            id: newUser._id,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            avatar: newUser.avatar || null,
            createdAt: newUser.createdAt,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.createUser = createUser;
// PUT /api/users/user/:id
const updateUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const { firstName, lastName, email, role, status, password } = req.body;
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (email)
            user.email = email;
        if (role)
            user.role = role;
        if (status)
            user.status = status;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(password, salt);
        }
        if (req.file) {
            user.avatar = `/uploads/${req.file.filename}`;
        }
        await user.save();
        res.json({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar: user.avatar || null,
            createdAt: user.createdAt,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateUser = updateUser;
// DELETE /api/users/user/:id
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Kiểm tra user tồn tại
        const user = await User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // Không cho xóa admin (tuỳ logic)
        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot delete admin user" });
        }
        // Nếu có avatar thì xóa file cũ trong uploads
        if (user.avatar && !user.avatar.startsWith("http")) {
            const filename = path_1.default.basename(user.avatar); // lấy tên file
            const filePath = path_1.default.join(__dirname, "../uploads", filename);
            try {
                if (fs_1.default.existsSync(filePath)) {
                    await fs_1.default.promises.unlink(filePath);
                    console.log("Deleted avatar:", filePath);
                }
            }
            catch (err) {
                console.error("Error deleting avatar file:", err);
            }
        }
        // Xóa user trong DB
        await User_1.default.findByIdAndDelete(userId);
        res.status(200).json({ message: "User deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteUser = deleteUser;
