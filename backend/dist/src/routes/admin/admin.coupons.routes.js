"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_COUPON_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const admin_coupon_controller_1 = require("../../modules/admin/controllers/admin.coupon.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin - Coupons
 *     description: Quản lý coupon trong admin
 */
/**
 * @swagger
 * /admin/coupons:
 *   get:
 *     summary: Danh sách coupon
 *     tags: [Admin - Coupons]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: active, expired...
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", admin_coupon_controller_1.adminCouponController.list);
/**
 * @swagger
 * /admin/coupons:
 *   post:
 *     summary: Tạo coupon mới
 *     tags: [Admin - Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Thông tin coupon (code, type, discount, date...)
 *     responses:
 *       201:
 *         description: Tạo coupon thành công
 */
router.post("/", admin_coupon_controller_1.adminCouponController.create);
/**
 * @swagger
 * /admin/coupons/{id}:
 *   patch:
 *     summary: Cập nhật coupon
 *     tags: [Admin - Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/:id", admin_coupon_controller_1.adminCouponController.update);
/**
 * @swagger
 * /admin/coupons/{id}:
 *   delete:
 *     summary: Xóa coupon
 *     tags: [Admin - Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", admin_coupon_controller_1.adminCouponController.remove);
exports.ADMIN_COUPON_ROUTES = router;
