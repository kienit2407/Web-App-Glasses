"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_FACE_ADVICE_ROUTES = void 0;
// src/routes/admin.face-advice.routes.ts
const express_1 = require("express");
const faceAdvice_controller_1 = require("../modules/client/controllers/faceAdvice.controller");
const router = (0, express_1.Router)();
router.post("/reindex", faceAdvice_controller_1.reindexFaceAdvice);
exports.ADMIN_FACE_ADVICE_ROUTES = router;
