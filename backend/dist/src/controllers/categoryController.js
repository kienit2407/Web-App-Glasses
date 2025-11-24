"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const Product_1 = __importDefault(require("../models/Product"));
// GET /api/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "name",
                    foreignField: "categoryName",
                    as: "productsList"
                }
            },
            {
                $addFields: {
                    products: { $size: "$productsList" }
                }
            },
            {
                $project: { productsList: 0 }
            }
        ]);
        res.json(categories);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getCategories = getCategories;
// POST /api/categories
const createCategory = async (req, res) => {
    try {
        const { name, status } = req.body;
        if (!name)
            return res.status(400).json({ message: "Name is required" });
        const exists = await Category_1.default.findOne({ name });
        if (exists)
            return res.status(400).json({ message: "Category already exists" });
        const category = await Category_1.default.create({ name, status: status || "Active" });
        res.status(201).json(category);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.createCategory = createCategory;
// PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        const { name, status } = req.body;
        const category = await Category_1.default.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: "Category not found" });
        if (name)
            category.name = name;
        if (status)
            category.status = status; // có thể Active hoặc Inactive
        await category.save();
        // Nếu category inactive, cũng có thể cập nhật tất cả product liên quan
        if (status === "Inactive") {
            await Product_1.default.updateMany({ category: category._id }, { status: "Inactive" });
        }
        res.json(category);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateCategory = updateCategory;
// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        const category = await Category_1.default.findByIdAndDelete(req.params.id);
        if (!category)
            return res.status(404).json({ message: "Category not found" });
        // Optionally: cũng xóa tất cả product thuộc category này
        await Product_1.default.deleteMany({ category: category._id });
        res.json({ message: "Category and related products deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteCategory = deleteCategory;
