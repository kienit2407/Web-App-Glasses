import express, { Router } from "express"
import { AUTH_ROUTES } from "./auth.routes"
import { USER_ROUTES } from "./user.routes"
import { PRODUCT_ROUTES } from "./product.routes"
import { BRAND_ROUTES } from "./brand.routes"
import { ADMIN_USERS_ROUTES } from "./admin/admin.users.routes"
import { ADMIN_CATEGORIES_ROUTES } from "./admin/admin.categories.routes"
import { ADMIN_PRODUCTS_ROUTES } from "./admin/admin.products.routes"
import { ADMIN_REVIEWS_ROUTES } from "./admin/admin.reviews.routes"
import { ADMIN_COUPON_ROUTES } from "./admin/admin.coupons.routes"
import { ADMIN_PROMOTIONS_ROUTES } from "./admin/admin.promotions"
import { ADMIN_ORDERS_ROUTES } from "./admin/admin.orders.routes"
import { ADDRESS_ROUTES } from "./address.routes"
import { CARTEGORY_ROUTES } from "./category.routes"
import { REVIEW_ROUTES } from "./review.routes"
import { CART_ROUTES } from "./cart.routes"
import { COUPON_ROUTES } from "./coupon.routes"
import { ORDER_ROUTES } from "./order.routes"
import { PAYMENT_ROUTES } from "./payment.routes"
import { GEO_ROUTES } from "./geo.routes"
import { SHIPPING_ROUTES } from "./shipping.routes"
import { ADMIN_BRANDS_ROUTES } from "./admin/admin.brands.routes"
import { ADMIN_SETTINGS_ROUTES } from "./admin/admin.settings.routes"
import { CHECKOUT_ROUTES } from "./checkout.routes"
import { ADMIN_DASHBOARD_ROUTES } from "./admin/admin.dashboard.routes"
import { PROMOTION_ROUTES } from "./promotion.routes"
import { SHOP_SETTINGS_ROUTES } from "./shop.settings.routes"
import { NOTIFICATION_ROUTES } from "./notification.routes"
import { ADMIN_NOTIFICATION_ROUTES } from "./admin/admin.notification.routes"
import { SUPPORT_ROUTES } from "./support.user.routes"
import { ADMIN_SUPPORT_ROUTES } from "./admin/admin.support.routes"


const router : Router = express.Router() 


// // health
// router.get("/health", (_,res) => res.json({ok:true}))

const client = express.Router()

client.use('/auth', AUTH_ROUTES)
client.use('/users', USER_ROUTES)
client.use('/users/me/address', ADDRESS_ROUTES) // để CRUD dễ dàng hơn

client.use('/catalog/categories', CARTEGORY_ROUTES)
client.use('/catalog/brands', BRAND_ROUTES)
client.use('/catalog/products', PRODUCT_ROUTES)

client.use("/checkout", CHECKOUT_ROUTES)

client.use('/reviews', REVIEW_ROUTES)
client.use('/notifications', NOTIFICATION_ROUTES)
client.use('/cart', CART_ROUTES)
client.use('/coupons', COUPON_ROUTES)
client.use('/checkouts', CHECKOUT_ROUTES)
client.use('/orders', ORDER_ROUTES)
client.use('/payments', PAYMENT_ROUTES)
client.use('/promotions', PROMOTION_ROUTES)
client.use("/shop-settings", SHOP_SETTINGS_ROUTES)
client.use("/support", SUPPORT_ROUTES)
client.use('/geo', GEO_ROUTES) // provinces/districts/wards
client.use('/shipping-fee', SHIPPING_ROUTES) // /shipping/quote

router.use('/', client)

//admin route
const admin = express.Router()
admin.use("/users", ADMIN_USERS_ROUTES)
admin.use("/categories", ADMIN_CATEGORIES_ROUTES)
admin.use("/brands", ADMIN_BRANDS_ROUTES) // mount địa chỉ ở đây 
admin.use("/products", ADMIN_PRODUCTS_ROUTES)
admin.use("/reviews", ADMIN_REVIEWS_ROUTES)
admin.use("/coupons", ADMIN_COUPON_ROUTES)
admin.use("/promotions", ADMIN_PROMOTIONS_ROUTES)
admin.use("/orders", ADMIN_ORDERS_ROUTES)
admin.use("/settings", ADMIN_SETTINGS_ROUTES)
admin.use("/dashboard", ADMIN_DASHBOARD_ROUTES)
admin.use("/support", ADMIN_SUPPORT_ROUTES)
admin.use("/notifications", ADMIN_NOTIFICATION_ROUTES)

router.use("/admin", admin)

export const API_ENTRYPOINT = router