// src/modules/client/controllers/shop.settings.controller.ts
import { Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { settingsService } from "../../admin/services/admin.shop.setting.service";

export const getPublicSettings = TryCatch(async (req: Request, res: Response) => {
  const settings = await settingsService.getFullSettings();
  return res.json({ data: settings });
});

export const shopSettingsController = {
  getPublicSettings,
};
