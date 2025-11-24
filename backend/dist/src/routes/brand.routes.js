"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const brand_controller_1 = require("../modules/client/controllers/brand.controller");
const router = express_1.default.Router();
router.get("/", /*brand.list*/ brand_controller_1.brandController.list); // ?active=1
// router.get("/:id", /*brand.detail*/)
exports.BRAND_ROUTES = router;
