"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CART_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const cart_controller_1 = require("../modules/client/controllers/cart.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/", cart_controller_1.cartController.getMyCart); // lấy giỏ hàng
router.post("/add-item", cart_controller_1.cartController.addItem); // thêm sản phẩm
router.patch("/update/:itemId", cart_controller_1.cartController.updateItem);
router.delete("/remove/:itemId", cart_controller_1.cartController.removeItem);
// router.get("/", cartController.addItem) // lấy giỏ hàng hiện tại
// router.post("/addItem", /*validate(addItem)*/cartController.addItem) // têm sản phẩm vào giỏ hàng
// router.patch("/update/:itemId", /*validate(updateItem),*/ /*cart.updateItem*/cartController.updateItem)
// router.delete("/remove/:itemId", cartController.removeItem)
exports.CART_ROUTES = router;
