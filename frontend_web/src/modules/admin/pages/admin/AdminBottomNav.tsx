import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, ShoppingBag, Headset } from "lucide-react";
import { Badge } from "antd";
import { useAdminSupportBadgeStore } from "@/hooks/use-admin-support-badge";

const bottom = [
    { to: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/admin/orders", label: "Đơn", icon: ShoppingCart },
    { to: "/admin/products", label: "SP", icon: ShoppingBag },
    { to: "/admin/conversations", label: "Chat", icon: Headset, badge: "support" as const },
];

export const AdminBottomNav = () => {
    const supportUnread = useAdminSupportBadgeStore((s) => s.unreadChatCount);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t md:hidden">
            <div className="grid grid-cols-4">
                {bottom.map((i) => {
                    const Icon = i.icon;
                    const count = i.badge === "support" ? supportUnread : 0;

                    return (
                        <NavLink
                            key={i.to}
                            to={i.to}
                            className={({ isActive }) =>
                                `py-2 flex flex-col items-center justify-center text-xs ${isActive ? "text-primary" : "text-slate-600"
                                }`
                            }
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {count > 0 && (
                                    <span className="absolute -top-2 -right-3">
                                        <Badge count={count} size="small" overflowCount={99} />
                                    </span>
                                )}
                            </div>
                            <span className="mt-1">{i.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};
