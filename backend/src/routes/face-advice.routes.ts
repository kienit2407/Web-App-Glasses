// src/routes/admin.face-advice.routes.ts
import { Router } from "express";
import { authMidleWares } from "../middleware/authMiddleware";
import { reindexFaceAdvice } from "../modules/client/controllers/faceAdvice.controller";

const router = Router();

router.post("/reindex", reindexFaceAdvice);

export const ADMIN_FACE_ADVICE_ROUTES = router;
