"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSizeGuides = exports.getSizeGuide = void 0;
const SizeGuide_1 = __importDefault(require("../models/SizeGuide"));
// GET /api/sizeguides/:categoryName
const getSizeGuide = async (req, res) => {
    try {
        const { categoryName } = req.params;
        const sizeGuide = await SizeGuide_1.default.findOne({ name: categoryName });
        if (!sizeGuide)
            return res.status(404).json({ message: "Size guide not found" });
        res.json(sizeGuide);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getSizeGuide = getSizeGuide;
// GET /api/sizeguides
const getAllSizeGuides = async (req, res) => {
    try {
        const guides = await SizeGuide_1.default.find();
        res.json(guides);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllSizeGuides = getAllSizeGuides;
