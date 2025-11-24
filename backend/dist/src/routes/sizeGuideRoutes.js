"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sizeGuideController_1 = require("../controllers/sizeGuideController");
const router = (0, express_1.Router)();
router.get("/", sizeGuideController_1.getAllSizeGuides);
router.get("/:categoryName", sizeGuideController_1.getSizeGuide);
exports.default = router;
