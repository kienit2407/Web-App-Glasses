"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const mongoose_1 = require("mongoose");
exports.OrderItem = (0, mongoose_1.model)('order_items', new mongoose_1.Schema({
    order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "orders", required: true, index: true },
    product_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true },
    variant_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "product_variants", required: true, index: true },
    sku: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    attributes: { type: mongoose_1.Schema.Types.Mixed, default: null },
    unit_price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 }
}));
