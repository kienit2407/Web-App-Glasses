// src/routes/client/shop.settings.routes.ts
import express, { Router } from "express";
import { shopSettingsController } from "../modules/client/controllers/shop.settings.controller";

const router: Router = express.Router();

// public
router.get("/", shopSettingsController.getPublicSettings);

export const SHOP_SETTINGS_ROUTES = router;
