"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
exports.Brand = (0, mongoose_1.model)('brands', new mongoose_1.Schema({
    brand_name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null },
    slug: { type: String, required: true, unique: true, trim: true },
    logo_url: { type: String, default: null },
    logo_id: { type: String, default: null },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }));
