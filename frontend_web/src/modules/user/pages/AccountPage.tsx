// src/pages/AccountPage.tsx
import { useMemo } from "react";
import { Layout, Menu, Typography } from "antd";
import {
    UserOutlined,
    HomeOutlined,
    GiftOutlined,
    ShoppingCartOutlined,
    BellOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";
import { ProfileTab } from "../components/ProfileTab";
import { AddressTab } from "../components/AddressTab";
import { CouponTab } from "../components/CouponTab";
import { OrdersTab } from "../components/OrdersTab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserNotificationsPage } from "../components/UserNotifications";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const AccountPage = () => {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { section } = useParams<{ section?: string }>();
    const activeKey = section || "profile";

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

    const menuItems = useMemo(
        () => [
            { key: "profile", icon: <UserOutlined />, label: "Hồ sơ" },
            { key: "address", icon: <HomeOutlined />, label: "Địa chỉ" },
            { key: "orders", icon: <ShoppingCartOutlined />, label: "Đơn mua" },
            { key: "coupon", icon: <GiftOutlined />, label: "Kho voucher" },
            { key: "notifications", icon: <BellOutlined />, label: "Thông báo" }, // 👈 tab mới
        ],
        []
    );

    const handleMenuClick = (key: string) => {
        navigate(`/account/${key}`);
    };

    const renderContent = () => {
        switch (activeKey) {
            case "profile":
                return <ProfileTab />;
            case "address":
                return <AddressTab />;
            case "orders":
                return <OrdersTab />;
            case "coupon":
                return <CouponTab />;
            case "notifications":                    // 👈 nội dung tab mới
                return <UserNotificationsPage />;
            default:
                return <ProfileTab />;
        }
    };

    const HeaderBlock = (
        <div className="p-6 border-b border-border flex items-center gap-3">
            <Avatar className={isMobile ? "h-12 w-12" : "h-16 w-16"}>
                <AvatarImage src={user?.avatar_url} alt={user?.display_name} />
                <AvatarFallback className={isMobile ? "text-lg" : "text-xl"}>
                    {getInitials(user?.display_name)}
                </AvatarFallback>
            </Avatar>
            <div>
                <Title level={5} className="!mb-1">
                    {user?.display_name || "Người dùng"}
                </Title>
                <Text type="secondary" className="text-xs">
                    Sửa hồ sơ & quản lý tài khoản
                </Text>
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-muted/40 py-8">
            <div className="container mx-auto px-4">
                {isMobile ? (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {HeaderBlock}
                        <Menu
                            mode="horizontal"
                            selectedKeys={[activeKey]}
                            onClick={(e) => handleMenuClick(e.key)}
                            items={menuItems}
                            className="border-b border-border px-2"
                        />
                        <div className="p-4">{renderContent()}</div>
                    </div>
                ) : (
                    <Layout className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <Sider width={260} className="bg-white border-r border-border">
                            {HeaderBlock}
                            <Menu
                                mode="inline"
                                selectedKeys={[activeKey]}
                                onClick={(e) => handleMenuClick(e.key)}
                                items={menuItems}
                            />
                        </Sider>
                        <Content className="p-8">{renderContent()}</Content>
                    </Layout>
                )}
            </div>
        </div>
    );
};

export default AccountPage;
