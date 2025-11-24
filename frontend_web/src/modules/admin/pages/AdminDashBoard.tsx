// src/pages/admin/Dashboard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { Card, Row, Col, Statistic, Typography, Tag } from "antd";
import {
    ShoppingCart,
    DollarSign,
    Clock,
    XCircle,
    CircleCheck,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
const { Title, Text } = Typography;

interface Summary {
    totalOrders: number;
    totalRevenue: number;
    pendingCount: number;
    deliveredCount: number;
    cancelledCount: number;
}

interface ChartPoint {
    date: string; // "MM-DD"
    revenue: number;
    orders: number;
}

interface DashboardResponse {
    summary: Summary;
    chart: ChartPoint[];
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
});

const Dashboard = () => {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await API.get("/admin/dashboard/summary");
            setData(res.data?.data as DashboardResponse);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
            </div>
        );
    }

    const { summary, chart } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <Title level={3} className="!mb-0">
                        Dashboard
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15, fontWeight: 'bold' }} className="text-black" >
                        Tổng quan đơn hàng & doanh thu 7 ngày gần nhất.
                    </Text>
                </div>
            </div>

            {/* Cards */}
            <Row gutter={[16, 16]}>
                {/* Total Sales */}
                <Col xs={24} md={8}>
                    <Card
                        className="h-full border-blue-100 shadow-sm"
                        bodyStyle={{ padding: 16 }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <Text type="secondary" style={{ fontSize: 15 }}>
                                    Tổng doanh thu
                                </Text>
                                <div className="mt-1">
                                    <Tag color="blue">7 ngày gần nhất</Tag>
                                </div>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <span className="text-2xl font-bold text-blue-600">
                                {currencyFormatter.format(summary.totalRevenue)}
                            </span>
                        </div>
                    </Card>
                </Col>

                {/* Total Orders */}
                <Col xs={24} md={8}>
                    <Card
                        className="h-full border-blue-100 shadow-sm"
                        bodyStyle={{ padding: 16 }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <Text type="secondary" style={{ fontSize: 15 }}>
                                    Tổng số đơn hàng
                                </Text>
                                <div className="mt-1">
                                    <Tag color="blue">7 ngày gần nhất</Tag>
                                </div>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                <ShoppingCart className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Statistic
                                value={summary.totalOrders}
                                formatter={(v) => (
                                    <span className="text-2xl font-bold text-blue-600">
                                        {Number(v).toLocaleString("vi-VN")}
                                        <span className="ml-1 text-sm font-normal text-slate-500">đơn</span>
                                    </span>
                                )}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Pending & Cancelled */}
                <Col xs={24} md={8}>
                    <Card
                        className="h-full border-blue-100 shadow-sm"
                        bodyStyle={{ padding: 16 }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <Text type="secondary" style={{ fontSize: 15 }}>
                                    Đơn chờ xử lý & đã huỷ
                                </Text>
                                <div className="mt-1">
                                    <Tag color="blue">7 ngày gần nhất</Tag>
                                </div>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                <Clock className="h-4 w-4 text-blue-500" />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between">
                            <div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="h-3 w-3 text-blue-500" />
                                    <span className="text-xl text-blue-600">Đang xử lý</span>
                                </div>
                                <div className="mt-1 text-2xl font-semibold text-blue-600">
                                    {summary.pendingCount}<span className="ml-1 text-sm font-normal  text-slate-500">đơn</span>
                                </div>
                            </div>
                            <div className="border-l border-slate-200 mx-4" />

                            <div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <CircleCheck className="h-3 w-3 text-green-500" />
                                    <span className="text-xl text-green-500">Hoàn thành</span>
                                </div>
                                <div className="mt-1 text-2xl font-semibold text-green-600">
                                    {summary.deliveredCount}<span className="ml-1 text-sm font-normal text-slate-500">đơn</span>
                                </div>
                            </div>



                            <div className="border-l border-slate-200 mx-4" />
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                                    <XCircle className="h-3 w-3 text-2xl text-red-500 " />
                                    <span className="text-xl text-red-500">Đã huỷ</span>
                                </div>
                                <div className="mt-1 text-2xl font-semibold text-red-500">
                                    {summary.cancelledCount}<span className="ml-1 text-sm font-normal text-slate-500">đơn</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Chart */}
            <Card
                title={
                    <div>
                        <span className="font-semibold text-slate-800">
                            Biểu đồ doanh thu 7 ngày gần nhất
                        </span>
                        <div className="text-xs text-slate-500">
                            Mỗi điểm biểu thị tổng doanh thu đơn đã hoàn thành theo ngày.
                        </div>
                    </div>
                }
                className="border-blue-100 shadow-sm"
                bodyStyle={{ padding: 16 }}
            >
                <div style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis
                                tickFormatter={(v) =>
                                    v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1_000}K`
                                }
                            />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === "revenue") {
                                        return currencyFormatter.format(Number(value));
                                    }
                                    return value;
                                }}
                                labelFormatter={(label) => `Ngày: ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#1677ff" // xanh dương Ant Design
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name="Doanh thu"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
