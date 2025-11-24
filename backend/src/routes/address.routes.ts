import express, { Router } from "express"
import { addressController } from "../modules/client/controllers/address.controller"
import { authMidleWares } from "../middleware/authMiddleware"


const router: Router = express.Router()
router.use(authMidleWares.protectUserRoute)

router.get("/", addressController.listMy) // get địa chỉ
router.post("/", /*validate(createAddr),*/ /*address.createMy*/addressController.createMy) // thêm địa chỉ
router.patch("/:addressId", /*validate(updateAddr),*/ /*address.updateMy*/addressController.updateMy) // chỉnh sửa
router.delete("/:addressId", /*address.deleteMy*/addressController.deleteMy) // xoá địa chỉ
router.patch("/:addressId/default", /*address.setDefaultMy*/addressController.setDefaultMy) // set default


export const ADDRESS_ROUTES = router
