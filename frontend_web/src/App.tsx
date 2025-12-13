import { Toaster } from "@/components/ui/sonner"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Navbar } from "@/modules/user/components/Navbar"
import { Footer } from "@/modules/user/components/Footer"
import Index from "./modules/user/pages/Index"
import Products from "./modules/user/pages/Products"
import ProductDetail from "./modules/user/pages/ProductDetail"
import Cart from "./modules/user/pages/Cart"
import Login from "./modules/user/pages/Login"
import NotFound from "./modules/user/pages/NotFound"
import { Spinner } from '@/components/ui/spinner'

import { useEffect } from "react"
import { AuthLayout } from "./layouts/AuthLayout"
import { UserLayout } from "./layouts/UserLayout"
import AdminLayout from "./modules/admin/layouts/AdminLayout"
import Dashboard from "./modules/admin/pages/AdminDashBoard"
import AdminOrders from "./modules/admin/pages/AdminOrders"
import AdminProducts from "./modules/admin/pages/AdminProduct"
import AdminUsers from "./modules/admin/pages/AdminUser"
import AdminSettings from "./modules/admin/pages/AdminSettings"
import { useAuth } from "./hooks/use-auth"
import { RequireAdmin, RequireAuth, RequireGuest } from "./app/guard"
import AdminCategories from "./modules/admin/pages/AdminCategories"
import AdminBrands from "./modules/admin/pages/AdminBrands"
import AdminProductDetail from "./modules/admin/pages/AdminVariant"
import AccountPage from "./modules/user/pages/AccountPage"
import Checkout from "./modules/user/pages/Checkout"
import OrderDetail from "./modules/user/pages/OrderDetail"
import AdminCouponPage from "./modules/admin/pages/AdminCoupon"
import AdminPromotionsPage from "./modules/admin/pages/AdminPromotions"
import AdminPromotions from "./modules/admin/pages/AdminPromotions"
import { CouponTab } from "./modules/user/components/CouponTab"
import CouponCenter from "./modules/user/pages/CouponCenter"
import AdminReviewsPage from "./modules/admin/pages/AdminReviews"
import AdminOrderDetailPage from "./modules/admin/pages/AdminOrderDetail"
import AdminOrderDetail from "./modules/admin/pages/AdminOrderDetail"
import { UserNotificationsPage } from "./modules/user/components/UserNotifications"
import { AdminNotificationsPage } from "./modules/admin/pages/AdminNotifications"
import { AdminSupportPage } from "./modules/admin/pages/AdminSupportPage"
import PaymentResult from "./modules/user/pages/PaymentResult"
import { VirtualTryOnPage } from "./modules/user/pages/VirtualTryOn"
import OAuthCallback from "./modules/user/pages/OAuthCallback"
import ScrollToTop from "./modules/admin/components/ScrollToTop"

const queryClient = new QueryClient() // dùng để quản lý cache dữ liệu api

const App = () => {

  const { bootstrap, isBootstrapping } = useAuth()
  const { accessToken } = useAuth();

  useEffect(() => {
    bootstrap() // tải thông tin user lần đầu
  }, [bootstrap])

  if (isBootstrapping) {
    // Có thể làm component loading xịn hơn
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground"> <Spinner /> </span>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* USER LAYOUT (navbar + footer) */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/virtual-tryon" element={<VirtualTryOnPage />} />
              <Route path="/products/:slug/:productId" element={<ProductDetail />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route
                path="/cart"
                element={
                  <RequireAuth>
                    <Cart />
                  </RequireAuth>
                }
              />
              <Route
                path="/coupon"
                element={
                  <CouponCenter />
                }
              />
              {/* redirect /account -> /account/profile */}
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Navigate to="/account/profile" replace />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RequireAuth>
                    <OrderDetail />
                  </RequireAuth>
                }
              />

              <Route
                path="/cart"
                element={
                  <RequireAuth>
                    <Cart />
                  </RequireAuth>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />
              {/* các tab trong account: /account/profile, /account/address, /account/orders, /account/coupon */}
              <Route
                path="/account/:section"
                element={
                  <RequireAuth>
                    <AccountPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireAuth>
                    <Navigate to="/account/orders" replace />
                  </RequireAuth>
                }
              />
            </Route>

            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  <RequireGuest>
                    <Login />
                  </RequireGuest>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:id/:slug" element={<AdminProductDetail />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id/:orderNumber" element={<AdminOrderDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="category" element={<AdminCategories />} />
              <Route path="brand" element={<AdminBrands />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="coupon" element={<AdminCouponPage />} />
              <Route path="promotion" element={<AdminPromotions />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="conversations/:conversationId" element={<AdminSupportPage />} />
              <Route path="conversations" element={<AdminSupportPage />} />
              <Route path="conversations/:conversationId" element={<AdminSupportPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
