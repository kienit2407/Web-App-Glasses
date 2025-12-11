// src/pages/AccountPage.tsx
import { useMemo, useState } from "react";
import { Dropdown, Layout, Menu, MenuProps, Typography } from "antd";
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
import { set } from "mongoose";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
type NitroState = '1' | '2'
const AccountPage = () => {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { section } = useParams<{ section?: string }>();
    const activeKey = section || "profile";
    const [nitro, setNitro] = useState<NitroState>("1")

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
            case "notifications":
                return <UserNotificationsPage />;
            default:
                return <ProfileTab />;
        }
    };
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: 'Vengeance',
            onClick: () => setNitro('1'),
        },
        {
            type: 'divider', // Đường gạch ngang phân cách
        },
        {
            key: '2',
            label: 'Under Sea',
            onClick: () => setNitro('2'),
        },
    ];
    const HeaderBlock = (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft">
            <div className="p-6 border-b border-border flex items-center gap-3 relative text-white cursor-pointer group hover:bg-white/5 transition-colors">

                {/* Content chính (Avatar + Text) */}
                <div className="relative z-10 flex items-center gap-4"> {/* Tăng gap lên xíu vì khung có thể lòi ra */}

                    {/* === BẮT ĐẦU PHẦN AVATAR CÓ KHUNG === */}
                    {/* 1. Tạo một div bọc ngoài làm mốc (relative) */}
                    <div className="relative flex items-center justify-center">

                        {/* 2. Avatar gốc (User Image) */}
                        <Avatar className="h-16 w-16 rounded-full border shadow-sm relative z-10">
                            <AvatarImage
                                src={user?.avatar_url || ""}
                                alt={user?.display_name}
                                className="object-cover"
                            />
                            <AvatarFallback className="text-2xl">
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* 3. KHUNG AVATAR (Frame) */}
                        {/* - absolute: để đè lên avatar
                   - top-1/2 left-1/2 ...: để căn chính giữa tâm avatar
                   - w-[130%]: Khung thường phải to hơn avatar gốc (khoảng 1.2 - 1.4 lần)
                   - z-20: Nằm đè lên trên avatar
                   - pointer-events-none: Để chuột bấm xuyên qua khung vào avatar
                */}
                        <img
                            src="/avt.webp" // Đường dẫn ảnh khung (phải là PNG trong suốt)
                            alt="Avatar Frame"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[118%] h-[118%] max-w-none z-20 pointer-events-none"
                        />
                    </div>
                    {/* === KẾT THÚC PHẦN AVATAR === */}

                    <div>
                        <Title level={5} className="!mb-1 text-white">
                            {user?.display_name || "Người dùng"}
                        </Title>
                        <Text className="text-xs text-black/70">
                            Sửa hồ sơ & quản lý tài khoản
                        </Text>
                    </div>
                </div>

                {/* Ảnh nền background to (giữ nguyên) */}
                <img
                    src={`/asset${nitro}.png`}
                    alt="Background decoration"
                    className="absolute bottom-0 right-0 w-full h-full object-cover z-0"
                />
            </div>
        </Dropdown>
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
function setSate<T>(arg0: string) {
    throw new Error("Function not implemented.");
}

