"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.District = void 0;
const mongoose_1 = require("mongoose");
exports.District = (0, mongoose_1.model)('districts', new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    province_code: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    ghn_id: { type: Number, required: true, unique: true, index: true },
    is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true }));
