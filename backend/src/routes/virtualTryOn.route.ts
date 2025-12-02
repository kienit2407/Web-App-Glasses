// src/routes/virtualTryOn.routes.ts
import express, { Router } from "express";
import { uploadMiddlewares } from "../middleware/upload.middlewares";
import { virtualTryOnController } from "../modules/client/controllers/virtualTryOn.controller";

const router: Router = express.Router();


router.post(
    "/virtual-tryon",
    uploadMiddlewares.upload.fields([
        { name: "face", maxCount: 1 },
        { name: "glasses", maxCount: 1 },
    ]),
    virtualTryOnController.create,
);

export const VIRTUAL_TRY_ON_ROUTES = router;
