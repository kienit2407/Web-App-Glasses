"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_ROUTES = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../modules/client/controllers/auth.controller");
const auth_validation_1 = require("../validation/auth.validation");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/signup", auth_validation_1.authValidator.signUp, auth_controller_1.authController.signUp);
router.post("/login", auth_validation_1.authValidator.logIn, auth_controller_1.authController.signIn);
router.post("/logout", authMiddleware_1.authMidleWares.protectUserRoute, auth_controller_1.authController.logOut);
router.post("/refresh", auth_controller_1.authController.refreshToken);
exports.AUTH_ROUTES = router;
