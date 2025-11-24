import express, { Router } from "express"
import { authController } from "../modules/client/controllers/auth.controller"
import { authValidator } from "../validation/auth.validation"
import { authMidleWares } from "../middleware/authMiddleware"


const router: Router = express.Router()

router.post("/signup", authValidator.signUp, authController.signUp)
router.post("/login", authValidator.logIn, authController.signIn)
router.post("/logout", authMidleWares.protectUserRoute, authController.logOut)
router.post("/refresh", authController.refreshToken)


export const AUTH_ROUTES = router
