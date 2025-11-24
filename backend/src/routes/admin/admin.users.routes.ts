import { adminUsersController } from "../../modules/admin/controllers/admin.user.controller"
import express, { Router } from "express"

const router: Router = express.Router()

router.get("/", /*adminUsers.list*/adminUsersController.list)               // search, page, limit
router.get("/:id", /*adminUsers.detail*/adminUsersController.detail)
router.post("/", adminUsersController.create)
router.get("/:id/login-history", adminUsersController.getLoginHistory)
router.patch("/:id/status", /*adminUsers.updateStatus*/adminUsersController.updateStatus) // is_active
router.patch("/:id/role", /*adminUsers.updateRole*/adminUsersController.updateRole)
// DELETE giờ là soft delete (set is_active=false)
router.delete("/:id", /*adminUsers.remove*/adminUsersController.remove)
export const ADMIN_USERS_ROUTES = router
