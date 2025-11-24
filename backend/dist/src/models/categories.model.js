"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
exports.Category = (0, mongoose_1.model)('categories', new mongoose_1.Schema({
    category_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null },
    parent_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "categories", default: null, index: true },
    is_active: { type: Boolean, default: true, index: true }
}, { timestamps: true }));
