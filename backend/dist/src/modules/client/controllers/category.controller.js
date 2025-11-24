"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const category_service_1 = require("../services/category.service");
const listCategories = (0, try_catch_1.TryCatch)(async (req, res) => {
    const { active, tree } = req.query;
    const data = await category_service_1.categoryService.listCategories({
        active: active === "1",
        tree: tree === "1",
    });
    return res.json({ data });
});
exports.categoryController = {
    listCategories
};
