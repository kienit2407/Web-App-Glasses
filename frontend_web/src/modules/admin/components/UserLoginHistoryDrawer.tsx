// src/pages/admin/users/UserLoginHistoryDrawer.tsx
import { Drawer, Table } from "antd"
import type { TableProps } from "antd"
import { useEffect, useState } from "react"
import { API } from "@/app/lib/axios-client"

interface LoginHistoryRow {
    id: string
    platform: "web" | "mobile"
    device: string | null
    ip: string | null
    user_agent: string | null
    atTime: string
}

interface ListResponse {
    user: {
        id: string
        email: string
        display_name: string
    }
    items: LoginHistoryRow[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

interface Props {
    open: boolean
    userId: string | null
    onClose: () => void
}

const UserLoginHistoryDrawer: React.FC<Props> = ({ open, userId, onClose }) => {
    const [data, setData] = useState<LoginHistoryRow[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [total, setTotal] = useState(0)
    const [userInfo, setUserInfo] = useState<{ email: string; display_name: string } | null>(null)

    const fetchHistory = async (p = page, l = limit) => {
        if (!userId) return
        setLoading(true)
        try {
            const res = await API.get(`/admin/users/${userId}/login-history`, {
                params: { page: p, limit: l },
            })
            const dataRes: ListResponse = res.data.data
            setData(dataRes.items)
            setPage(dataRes.pagination.page)
            setLimit(dataRes.pagination.limit)
            setTotal(dataRes.pagination.total)
            setUserInfo({
                email: dataRes.user.email,
                display_name: dataRes.user.display_name,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && userId) {
            fetchHistory(1, limit)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId])

    const columns: TableProps<LoginHistoryRow>["columns"] = [
        {
            title: "Thời gian",
            dataIndex: "atTime",
            key: "atTime",
            render: (value: string) =>
                new Date(value).toLocaleString("vi-VN"),
        },
        {
            title: "Platform",
            dataIndex: "platform",
            key: "platform",
        },
        {
            title: "Thiết bị",
            dataIndex: "device",
            key: "device",
            render: (v) => v || <span className="text-slate-400 italic">N/A</span>,
        },
        {
            title: "IP",
            dataIndex: "ip",
            key: "ip",
            render: (v) => v || <span className="text-slate-400 italic">N/A</span>,
        },
        {
            title: "User Agent",
            dataIndex: "user_agent",
            key: "user_agent",
            ellipsis: true,
        },
    ]

    return (
        <Drawer
            title={
                userInfo
                    ? `Lịch sử đăng nhập - ${userInfo.display_name} (${userInfo.email})`
                    : "Lịch sử đăng nhập"
            }
            width={720}
            onClose={onClose}
            open={open}
        >
            <Table<LoginHistoryRow>
                loading={loading}
                columns={columns}
                dataSource={data}
                rowKey={(record) => record.id}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total,
                    onChange: (p, l) => fetchHistory(p, l),
                }}
            />
        </Drawer>
    )
}

export default UserLoginHistoryDrawer
