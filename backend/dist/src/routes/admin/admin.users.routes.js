"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_USERS_ROUTES = void 0;
const admin_user_controller_1 = require("../../modules/admin/controllers/admin.user.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/", /*adminUsers.list*/ admin_user_controller_1.adminUsersController.list); // search, page, limit
router.get("/:id", /*adminUsers.detail*/ admin_user_controller_1.adminUsersController.detail);
router.post("/", admin_user_controller_1.adminUsersController.create);
router.get("/:id/login-history", admin_user_controller_1.adminUsersController.getLoginHistory);
router.patch("/:id/status", /*adminUsers.updateStatus*/ admin_user_controller_1.adminUsersController.updateStatus); // is_active
router.patch("/:id/role", /*adminUsers.updateRole*/ admin_user_controller_1.adminUsersController.updateRole);
// DELETE giờ là soft delete (set is_active=false)
router.delete("/:id", /*adminUsers.remove*/ admin_user_controller_1.adminUsersController.remove);
exports.ADMIN_USERS_ROUTES = router;
