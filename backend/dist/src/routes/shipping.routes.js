"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIPPING_ROUTES = void 0;
//tính phí 
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMidleWares.protectUserRoute);
// router.post("/quote", /*/*requireAuth,*/ /*validate(quoteSchema),*/ /*ship.quote*/shippingController.quote)
// router.post("/available-services", shippingController.availableServices);
exports.SHIPPING_ROUTES = router;
