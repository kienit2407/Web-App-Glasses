"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Province = void 0;
const mongoose_1 = require("mongoose");
exports.Province = (0, mongoose_1.model)('provinces', new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    // mapping sang GHN
    ghn_id: { type: Number, required: true, unique: true, index: true },
    is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true }));
