"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductById = exports.updateProductById = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// GET /api/products
const getProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 12 } = req.query;
        // Lọc category active
        const activeCategories = await Category_1.default.find({ status: "Active" }).select("_id name");
        const activeCategoryIds = activeCategories.map(cat => cat._id);
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (category) {
            // chỉ lấy khi category được chọn và nó active
            if (activeCategoryIds.includes(category.toString())) {
                query.category = category;
            }
            else {
                query.category = null; // không tìm thấy gì
            }
        }
        else {
            query.category = { $in: activeCategoryIds };
        }
        const total = await Product_1.default.countDocuments(query);
        const products = await Product_1.default.find(query)
            .populate("category", "name status")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        res.json({ products, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getProducts = getProducts;
// GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.json(product);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getProductById = getProductById;
// POST /api/products
const createProduct = async (req, res) => {
    try {
        const { legacyId, name, price, description, categoryName, category, stock, isActive, status } = req.body;
        let categoryId = null;
        if (categoryName) {
            const category = await Category_1.default.findOne({ name: categoryName });
            if (category) {
                categoryId = category._id;
            }
        }
        // Nếu có file upload thì thêm vào images[]
        let images = [];
        if (req.files && Array.isArray(req.files)) {
            images = req.files.map((file) => `/uploads/${file.filename}`);
        }
        const newProduct = new Product_1.default({
            legacyId,
            name,
            price,
            description,
            categoryName,
            category: categoryId,
            stock,
            isActive,
            status,
            images,
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.createProduct = createProduct;
// PUT /api/products/:id
const updateProductById = async (req, res) => {
    try {
        const { name, price, description, category, categoryName, legacyId, stock, status, images, removeImages } = req.body;
        const product = await Product_1.default.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        // Nếu có đổi category theo tên
        if (categoryName) {
            const category = await Category_1.default.findOne({ name: categoryName });
            if (category) {
                product.category = category._id;
                product.categoryName = category.name;
            }
        }
        // Update các field cơ bản
        product.name = name ?? product.name;
        product.price = price ?? product.price;
        product.description = description ?? product.description;
        product.legacyId = legacyId ?? product.legacyId;
        product.stock = stock ?? product.stock;
        product.status = status ?? product.status;
        product.isActive = status !== "Inactive";
        // 👉 Xử lý removeImages
        if (removeImages) {
            let toRemove = [];
            try {
                toRemove = JSON.parse(removeImages); // client gửi dạng JSON array
            }
            catch {
                toRemove = [removeImages]; // nếu gửi string
            }
            // Lọc giữ lại ảnh chưa xóa
            product.images = product.images.filter((img) => !toRemove.includes(img));
            // Xóa file vật lý trong uploads/
            toRemove.forEach((imgPath) => {
                const relativePath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
                const absolutePath = path_1.default.join(__dirname, "..", "..", relativePath);
                if (fs_1.default.existsSync(absolutePath)) {
                    fs_1.default.unlinkSync(absolutePath);
                    console.log("🗑️ Deleted file:", absolutePath);
                }
                else {
                    console.warn("⚠️ File not found:", absolutePath);
                }
            });
        }
        // 👉 Thêm ảnh mới (append, không xóa ảnh cũ trừ khi có removeImages)
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const newImages = req.files.map((file) => `/uploads/${file.filename}`);
            product.images = [...product.images, ...newImages];
        }
        await product.save();
        res.json(product);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProductById = updateProductById;
// DELETE /api/products/:id
const deleteProductById = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        // Xóa ảnh local trong uploads
        if (product.images && product.images.length > 0) {
            for (const imgPath of product.images) {
                // lấy tên file từ DB
                const filename = path_1.default.basename(imgPath);
                const filePath = path_1.default.join(process.cwd(), "uploads", filename);
                console.log("Deleting file at:", filePath);
                try {
                    if (fs_1.default.existsSync(filePath)) {
                        await fs_1.default.promises.unlink(filePath);
                        console.log("Deleted:", filePath);
                    }
                    else {
                        console.log("File not found:", filePath);
                    }
                }
                catch (err) {
                    console.error("Error deleting file:", err);
                }
            }
        }
        await Product_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteProductById = deleteProductById;
