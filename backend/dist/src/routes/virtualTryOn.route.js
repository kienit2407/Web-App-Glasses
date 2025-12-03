"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIRTUAL_TRY_ON_ROUTES = void 0;
// src/routes/virtualTryOn.routes.ts
const express_1 = __importDefault(require("express"));
const upload_middlewares_1 = require("../middleware/upload.middlewares");
const virtualTryOn_controller_1 = require("../modules/client/controllers/virtualTryOn.controller");
const router = express_1.default.Router();
router.post("/virtual-tryon", upload_middlewares_1.uploadMiddlewares.upload.fields([
    { name: "face", maxCount: 1 },
    { name: "glasses", maxCount: 1 },
]), virtualTryOn_controller_1.virtualTryOnController.create);
exports.VIRTUAL_TRY_ON_ROUTES = router;
