"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartDetail = void 0;
const mongoose_1 = require("mongoose");
exports.CartDetail = (0, mongoose_1.model)('cart_details', new mongoose_1.Schema({
    cart_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "carts", required: true, index: true },
    variant_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "product_variants", required: true, index: true },
    price_at_add: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}).index({
    cart_id: 1,
    variant_id: 1
}, { unique: true } // không cho trùng 1 variant trong cùng một giỏ hàng => nó sẽ bị gộp thành 1 sản phẩm và tăng số lượng lên 2
));
