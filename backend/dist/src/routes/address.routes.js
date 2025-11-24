"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADDRESS_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("../modules/client/controllers/address.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
router.get("/", address_controller_1.addressController.listMy); // get địa chỉ
router.post("/", /*validate(createAddr),*/ /*address.createMy*/ address_controller_1.addressController.createMy); // thêm địa chỉ
router.patch("/:addressId", /*validate(updateAddr),*/ /*address.updateMy*/ address_controller_1.addressController.updateMy); // chỉnh sửa
router.delete("/:addressId", /*address.deleteMy*/ address_controller_1.addressController.deleteMy); // xoá địa chỉ
router.patch("/:addressId/default", /*address.setDefaultMy*/ address_controller_1.addressController.setDefaultMy); // set default
exports.ADDRESS_ROUTES = router;
