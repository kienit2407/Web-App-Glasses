"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const categories_model_1 = require("../../../models/categories.model");
exports.categoryService = {
    async listCategories(options) {
        const filter = {};
        if (options.active) {
            filter.is_active = true;
        }
        const categories = await categories_model_1.Category.find(filter)
            .sort({ createdAt: 1 })
            .lean();
        if (!options.tree) {
            return categories;
        }
        // build tree
        const map = new Map();
        categories.forEach((cat) => {
            const id = String(cat._id);
            map.set(id, { ...cat, category_id: id, children: [] });
        });
        const roots = [];
        map.forEach((cat) => {
            if (cat.parent_id) {
                const parent = map.get(String(cat.parent_id));
                if (parent) {
                    parent.children.push(cat);
                    return;
                }
            }
            roots.push(cat);
        });
        return roots;
    },
};
