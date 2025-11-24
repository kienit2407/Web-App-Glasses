"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENTRYPOINT = void 0;
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("./auth.routes");
const user_routes_1 = require("./user.routes");
const product_routes_1 = require("./product.routes");
const brand_routes_1 = require("./brand.routes");
const admin_users_routes_1 = require("./admin/admin.users.routes");
const admin_categories_routes_1 = require("./admin/admin.categories.routes");
const admin_products_routes_1 = require("./admin/admin.products.routes");
const admin_reviews_routes_1 = require("./admin/admin.reviews.routes");
const admin_coupons_1 = require("./admin/admin.coupons");
const admin_promotions_1 = require("./admin/admin.promotions");
const admin_orders_routes_1 = require("./admin/admin.orders.routes");
const address_routes_1 = require("./address.routes");
const category_routes_1 = require("./category.routes");
const review_routes_1 = require("./review.routes");
const cart_routes_1 = require("./cart.routes");
const coupon_routes_1 = require("./coupon.routes");
const order_routes_1 = require("./order.routes");
const payment_routes_1 = require("./payment.routes");
const geo_routes_1 = require("./geo.routes");
const shipping_routes_1 = require("./shipping.routes");
const admin_brands_routes_1 = require("./admin/admin.brands.routes");
const admin_settings_routes_1 = require("./admin/admin.settings.routes");
const checkout_routes_1 = require("./checkout.routes");
const admin_dashboard_routes_1 = require("./admin/admin.dashboard.routes");
const promotion_routes_1 = require("./promotion.routes");
const shop_settings_routes_1 = require("./shop.settings.routes");
const router = express_1.default.Router();
// // health
// router.get("/health", (_,res) => res.json({ok:true}))
const client = express_1.default.Router();
client.use('/auth', auth_routes_1.AUTH_ROUTES);
client.use('/users', user_routes_1.USER_ROUTES);
client.use('/users/me/address', address_routes_1.ADDRESS_ROUTES); // để CRUD dễ dàng hơn
client.use('/catalog/categories', category_routes_1.CARTEGORY_ROUTES);
client.use('/catalog/brands', brand_routes_1.BRAND_ROUTES);
client.use('/catalog/products', product_routes_1.PRODUCT_ROUTES);
client.use("/checkout", checkout_routes_1.CHECKOUT_ROUTES);
client.use('/reviews', review_routes_1.REVIEW_ROUTES);
client.use('/cart', cart_routes_1.CART_ROUTES);
client.use('/coupons', coupon_routes_1.COUPON_ROUTES);
client.use('/checkouts', checkout_routes_1.CHECKOUT_ROUTES);
client.use('/orders', order_routes_1.ORDER_ROUTES);
client.use('/payments', payment_routes_1.PAYMENT_ROUTES);
client.use('/promotions', promotion_routes_1.PROMOTION_ROUTES);
client.use("/shop-settings", shop_settings_routes_1.SHOP_SETTINGS_ROUTES);
client.use('/geo', geo_routes_1.GEO_ROUTES); // provinces/districts/wards
client.use('/shipping-fee', shipping_routes_1.SHIPPING_ROUTES); // /shipping/quote
router.use('/', client);
//admin route
const admin = express_1.default.Router();
admin.use("/users", admin_users_routes_1.ADMIN_USERS_ROUTES);
admin.use("/categories", admin_categories_routes_1.ADMIN_CATEGORIES_ROUTES);
admin.use("/brands", admin_brands_routes_1.ADMIN_BRANDS_ROUTES); // mount địa chỉ ở đây 
admin.use("/products", admin_products_routes_1.ADMIN_PRODUCTS_ROUTES);
admin.use("/reviews", admin_reviews_routes_1.ADMIN_REVIEWS_ROUTES);
admin.use("/coupons", admin_coupons_1.ADMIN_COUPON_ROUTES);
admin.use("/promotions", admin_promotions_1.ADMIN_PROMOTIONS_ROUTES);
admin.use("/orders", admin_orders_routes_1.ADMIN_ORDERS_ROUTES);
admin.use("/settings", admin_settings_routes_1.ADMIN_SETTINGS_ROUTES);
admin.use("/dashboard", admin_dashboard_routes_1.ADMIN_DASHBOARD_ROUTES);
router.use("/admin", admin);
exports.API_ENTRYPOINT = router;
