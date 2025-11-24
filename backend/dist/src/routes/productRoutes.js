"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// GET
router.get("/", productController_1.getProducts);
router.get("/:id", productController_1.getProductById);
// POST
// router.post("/", upload.array("images"), createProduct); // array nếu nhiều file
// // PUT
// router.put("/:id", upload.array("images"), updateProductById);
// DELETE
router.delete("/:id", productController_1.deleteProductById);
exports.default = router;
