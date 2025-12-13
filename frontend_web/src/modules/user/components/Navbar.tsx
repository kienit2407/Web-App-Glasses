import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  Glasses,
  LogOut,
  Package,
  UserCircle,
  ChevronDown,
  Bell,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button as ButtonAnt } from "antd";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useShopSettingsStore } from "@/hooks/use-setting";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "antd";
import { useUserNotificationStore } from "@/hooks/use-user-notification";
import { NotificationBell } from "./NotificationBell";


type ProductType = "frame" | "sunglasses";

const GENDERS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
  { label: "Unisex", value: "unisex" },
  { label: "Trẻ em", value: "kids" },
];

const SHAPES = [
  { label: "Vuông", value: "square" },
  { label: "Chữ nhật", value: "rectangle" },
  { label: "Tròn", value: "round" },
  { label: "Browline", value: "browline" },
  { label: "Oval", value: "oval" },
  { label: "Đa giác", value: "polygon" },
  { label: "Mắt mèo", value: "cat-eye" },
  { label: "Phi công", value: "pilot" },
  { label: "Thể thao", value: "sport" },
];

export const Navbar = () => {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const { settings } = useShopSettingsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, fetchCart } = useCart()
  const goAccount = () => navigate("/account/profile");
  const goOrders = () => navigate("/account/orders");
  const goCoupon = () => navigate("account/coupon");
  const goLogin = () => navigate("/login");

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };
  useEffect(() => {
    fetchCart()
  }, [fetchCart])
  // --- điều hướng khi click filter trong mega menu ---
  const goToFilter = (
    type: ProductType,
    extra: { gender?: string; shape?: string }
  ) => {
    const params = new URLSearchParams();
    params.set("type", type);
    if (extra.gender) params.set("gender", extra.gender);
    if (extra.shape) params.set("shape", extra.shape);

    navigate(`/products?${params.toString()}`);
  };

  // helper check active route
  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // class cho item nav thường
  const baseNavItem =
    "relative inline-flex items-center gap-1 py-2 text-sm font-medium transition-colors";
  const navUnderline =
    "pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-primary transition-all duration-200 group-hover:w-full";
  const {
    items: notifItems,
    unreadCount: notifUnread,
    loading: notifLoading,
    fetchFirstPage,
    markRead,
    markAllRead,
    markReadLocal,
    markAllReadLocal,
  } = useUserNotificationStore();


  useEffect(() => {
    if (user) {
      // load lần đầu khi đã đăng nhập
      fetchFirstPage();
    }
  }, [fetchFirstPage, user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-10 px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 font-bold text-xl"
          >
            {settings?.shop_logo_url ? (
              <img className="w-20 h-auto" src={settings.shop_logo_url} />
            ) : (
              <Glasses className="h-6 w-6 text-primary" />
            )}
            <div className="text-gradient">
              {settings?.shop_name || "Tên cửa hàng"}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Trang chủ */}
            <div className="relative group">
              <Link
                to="/"
                className={`${baseNavItem} ${isActivePath("/")
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
                  }`}
              >
                Trang chủ
              </Link>
              <div
                className={`${navUnderline} ${isActivePath("/") ? "w-full" : ""
                  }`}
              />
            </div>

            {/* Sản phẩm */}
            <div className="relative group">
              <Link
                to="/products"
                className={`${baseNavItem} ${isActivePath("/products")
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
                  }`}
              >
                Sản phẩm
              </Link>
              <div
                className={`${navUnderline} ${isActivePath("/products") ? "w-full" : ""
                  }`}
              />
            </div>

            {/* GỌNG KÍNH */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => goToFilter("frame", {})}
                className={`${baseNavItem} text-foreground hover:text-primary`}
              >
                <span>Gọng kính</span>
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className={navUnderline} />

              {/* Mega dropdown */}
              <div className="pointer-events-none absolute left-1/2 top-full z-40 w-[640px] -translate-x-1/2 rounded-lg border bg-background p-6 shadow-lg opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                {/* header dòng trên cùng */}
                <div className="mb-4 flex items-center justify-between text-[16px] font-bold text-muted-foreground">
                  <span>Lọc gọng kính theo nhu cầu</span>
                  <button
                    onClick={() => goToFilter("frame", {})}
                    className="text-[14px] font-medium text-primary hover:underline"
                  >
                    Xem tất cả gọng kính →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  {/* Giới tính */}
                  <div>
                    <div className="mb-2 font-semibold text-foreground">
                      Giới tính
                    </div>
                    <div className="flex flex-col gap-1">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          className="rounded px-1 py-1 text-left text-muted-foreground hover:bg-accent/60 hover:text-primary hover:underline hover:font-bold"
                          onClick={() =>
                            goToFilter("frame", { gender: g.value })
                          }
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kiểu dáng */}
                  <div>
                    <div className="mb-2 font-semibold text-foreground">
                      Kiểu dáng
                    </div>
                    <div className="flex flex-col gap-1">
                      {SHAPES.map((s) => (
                        <button
                          key={s.value}
                          className="rounded px-1 py-1 text-left text-muted-foreground hover:bg-accent/60 hover:text-primary hover:underline hover:font-bold"
                          onClick={() =>
                            goToFilter("frame", { shape: s.value })
                          }
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KÍNH MÁT */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => goToFilter("sunglasses", {})}
                className={`${baseNavItem} text-foreground hover:text-primary`}
              >
                <span>Kính mát</span>
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className={navUnderline} />

              <div className="pointer-events-none absolute left-1/2 top-full z-40 w-[640px] -translate-x-1/2 rounded-lg border bg-background p-6 shadow-lg opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="mb-4 flex items-center justify-between text-[16px] font-bold text-muted-foreground">
                  <span>Lọc kính mát theo nhu cầu</span>
                  <button
                    onClick={() => goToFilter("sunglasses", {})}
                    className="text-[14px] font-medium text-primary hover:underline"
                  >
                    Xem tất cả kính mát →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  {/* Giới tính */}
                  <div>
                    <div className="mb-2 font-semibold text-foreground">
                      Giới tính
                    </div>
                    <div className="flex flex-col gap-1">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          className="rounded px-1 py-1 text-left text-muted-foreground hover:bg-accent/60 hover:text-primary hover:underline hover:font-bold"
                          onClick={() =>
                            goToFilter("sunglasses", { gender: g.value })
                          }
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kiểu dáng */}
                  <div>
                    <div className="mb-2 font-semibold text-foreground">
                      Kiểu dáng
                    </div>
                    <div className="flex flex-col gap-1">
                      {SHAPES.map((s) => (
                        <button
                          key={s.value}
                          className="rounded px-1 py-1 text-left text-muted-foreground hover:bg-accent/60 hover:text-primary hover:underline hover:font-bold"
                          onClick={() =>
                            goToFilter("sunglasses", { shape: s.value })
                          }
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Các link khác */}
            <div className="relative group">
              <Link
                to="/coupon"
                className={`${baseNavItem} ${isActivePath("/coupon")
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
                  }`}
              >
                Khuyến mãi
              </Link>
              <div
                className={`${navUnderline} ${isActivePath("/about") ? "w-full" : ""
                  }`}
              />
            </div>

            <div className="relative group">
              <Link
                to="/virtual-tryon"
                className={`${baseNavItem} ${isActivePath("/virtual-tryon")
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
                  }`}
              >
                Phòng thử kính ảo
              </Link>
              <div
                className={`${navUnderline} ${isActivePath("/about") ? "w-full" : ""
                  }`}
              />
            </div>

          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/cart">
              <Badge count={cart?.items.length || 0} size="default" overflowCount={99}>
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center bg-slate-200 justify-center rounded-full hover:bg-blue-100 transition"
                >
                  <ShoppingCart className="h-[18px] w-[18px]" />
                </button>
              </Badge>
            </Link>

            {user ? (<NotificationBell
              items={notifItems}
              unreadCount={notifUnread}
              loading={notifLoading}
              hasMore={false}
              onLoadMore={undefined}
              onItemClick={async (item) => {
                if (!item.isRead) {
                  // optimistic update
                  markReadLocal(item.id);
                  await markRead(item.id);
                }
                navigate(`/orders/${item.meta.order_id}`);

              }}
              onViewAll={() => {
                navigate("/account/notifications");
              }}
              onMarkAllRead={async () => {
                markAllReadLocal();
                await markAllRead();
              }}
              onOpenChange={(open) => {
                if (open && user) {
                  // mỗi lần mở dropdown, đảm bảo sync lại với server
                  fetchFirstPage();
                }
              }}
            />) : null}


            {!user ? (
              <Link to="/login">
                <Button variant="ghost" size="icon">
                  <User className="h-[14px] w-[14px]" />
                </Button>
              </Link>
            ) : (
              <DropdownMenu

              >
                <DropdownMenuTrigger asChild >
                  <Button className="flex items-center gap-2 px-2 hover:bg-blue-50 focus:text-blue-700 data-[state=open]:bg-blue-100 transition-colors" variant="ghost" >
                    <Avatar className="h-10 w-10 !object-cover">
                      <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover"/>
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[140px] truncate text-sm font-medium">
                      {user.display_name}›
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[260px]">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 object-cover">
                      <AvatarImage src={user.avatar_url}  className="object-cover"/>
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">
                        {user.display_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={goAccount}
                    className="focus:bg-blue-100 focus:text-blue-700 cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Tài khoản của tôi</span>
                  </DropdownMenuItem >
                  <DropdownMenuItem onClick={goOrders} className="focus:bg-blue-100 focus:text-blue-700 cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Đơn hàng</span>
                  </DropdownMenuItem >
                  <DropdownMenuItem onClick={goCoupon} className="focus:bg-blue-100 focus:text-blue-700 cursor-pointer">
                    <Ticket className="mr-2 h-4 w-4" />
                    <span>Voucher của tôi</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}
                    className="focus:bg-red-100 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border mt-2">
            {user ? (<NotificationBell
              items={notifItems}
              unreadCount={notifUnread}
              loading={notifLoading}
              hasMore={false}
              onLoadMore={undefined}
              onItemClick={async (item) => {
                if (!item.isRead) {
                  // optimistic update
                  markReadLocal(item.id);
                  await markRead(item.id);
                }
                navigate(`/orders/${item.meta.order_id}`);

              }}
              onViewAll={() => {
                navigate("/account/notifications");
              }}
              onMarkAllRead={async () => {
                markAllReadLocal();
                await markAllRead();
              }}
              onOpenChange={(open) => {
                if (open && user) {
                  // mỗi lần mở dropdown, đảm bảo sync lại với server
                  fetchFirstPage();
                }
              }}
            />) : null}


            <Link to="/" className="block py-2 text-foreground hover:text-primary">
              Trang chủ
            </Link>

            <button
              className="block w-full text-left py-2 text-foreground hover:text-primary"
              onClick={() => goToFilter("frame", {})}
            >
              Gọng kính
            </button>
            <button
              className="block w-full text-left py-2 text-foreground hover:text-primary"
              onClick={() => goToFilter("sunglasses", {})}
            >
              Kính mát
            </button>

            <Link
              to="/products"
              className="block py-2 text-foreground hover:text-primary"
            >
              Tất cả sản phẩm
            </Link>

            <Link
              to="/coupon"
              className={`${baseNavItem} ${isActivePath("/coupon")
                ? "text-primary"
                : "text-foreground hover:text-primary"
                }`}
            >
              Khuyến mãi
            </Link>
            <div className="flex gap-2 pt-2">
              <Link to="/cart" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Giỏ hàng
                </Button>
              </Link>

              {!user ? (
                <Button className="flex-1" variant="outline" onClick={goLogin}>
                  <User className="h-4 w-4 mr-2" />
                  Đăng nhập
                </Button>
              ) : (
                <Button className="flex-1" variant="outline" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
