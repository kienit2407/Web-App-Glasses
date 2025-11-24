"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ward = void 0;
const mongoose_1 = require("mongoose");
exports.Ward = (0, mongoose_1.model)('wards', new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    district_code: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    ghn_id: { type: String, required: true, unique: true, index: true },
    is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true }));
