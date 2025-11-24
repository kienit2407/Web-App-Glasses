// src/modules/user/account/CouponTab.tsx
import { useEffect } from "react";
import { Table, Tag, Typography } from "antd";
import { Spinner } from "@/components/ui/spinner";
import { useCouponStore, UserCouponItem } from "@/hooks/use-coupon";

const { Title } = Typography;

export const CouponTab = () => {
    const {
        myCoupons,
        myCouponsLoading,
        fetchMyCoupons,
    } = useCouponStore();

    useEffect(() => {
        // chỉ cần load 1 lần, không cần subtotal
        fetchMyCoupons();
    }, [fetchMyCoupons]);

    const columns = [
        {
            title: "Mã",
            dataIndex: "code",
            render: (code: string) => (
                <Tag color="red" className="font-semibold text-base">
                    {code}
                </Tag>
            ),
        },
        {
            title: "Giảm giá",
            render: (_: unknown, row: UserCouponItem) => {
                if (row.type === "percent") {
                    return `${row.value}%${row.max_discount
                            ? ` (tối đa ${row.max_discount.toLocaleString("vi-VN")}đ)`
                            : ""
                        }`;
                }
                return `${row.value.toLocaleString("vi-VN")}đ`;
            },
        },
        {
            title: "Đơn tối thiểu",
            render: (_: unknown, row: UserCouponItem) =>
                row.min_order
                    ? `${row.min_order.toLocaleString("vi-VN")}đ`
                    : "Không yêu cầu",
        },
        {
            title: "Hạn dùng",
            render: (_: unknown, row: UserCouponItem) =>
                row.end_date
                    ? new Date(row.end_date).toLocaleDateString("vi-VN")
                    : "Không giới hạn",
        },
        {
            title: "Trạng thái",
            render: (_: unknown, row: UserCouponItem) => {
                if (row.is_used) {
                    return <Tag color="default">Đã dùng</Tag>;
                }
                if (row.is_expired) {
                    return <Tag color="default">Hết hạn</Tag>;
                }
                return <Tag color="green">Có thể dùng</Tag>;
            },
        },
    ];

    return (
        <div>
            <Title level={4}>Kho voucher của tôi</Title>

            {myCouponsLoading ? (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            ) : (
                <Table<UserCouponItem>
                    rowKey="_id"
                    dataSource={myCoupons}
                    pagination={false}
                    className="mt-6"
                    columns={columns}
                />
            )}
        </div>
    );
};
