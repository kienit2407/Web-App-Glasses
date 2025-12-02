// src/modules/face-advice/faceAdvice.controller.ts
import { Request, Response } from "express";
import { indexFaceAdviceToQdrant } from "../service/faceAdvice.service";
import { TryCatch } from "../../../utils/try_catch";


export const reindexFaceAdvice = TryCatch(async (_req: Request, res: Response) => {
    await indexFaceAdviceToQdrant();
    return res.json({ message: "Reindexed face advice to Qdrant" });
});
