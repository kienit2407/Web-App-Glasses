"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reindexFaceAdvice = void 0;
const try_catch_1 = require("../../../utils/try_catch");
const faceAdvice_service_1 = require("../services/faceAdvice.service");
exports.reindexFaceAdvice = (0, try_catch_1.TryCatch)(async (_req, res) => {
    await (0, faceAdvice_service_1.indexFaceAdviceToQdrant)();
    return res.json({ message: "Reindexed face advice to Qdrant" });
});
