/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Tabs,
  Popconfirm,
  Drawer,
  Descriptions,
  Select,
} from "antd";
import type { TableProps, TabsProps } from "antd";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import AdminUserModal from "../components/AdminUserModal";
import { formatDeviceLabel } from "@/utils/formatDeviceLabel";

type UserStatusTab = "active" | "inactive";

type Role = "user" | "admin";

export interface AdminUserRow {
  _id: string;
  email: string;
  display_name: string;
  roles: Role[];
  is_active: boolean;
  avatar_url?: string | null;
  last_login?: {
    ip?: string | null;
    device?: string | null;
    atTime?: string | null;
  } | null;
  createdAt: string;
}

interface ListUsersResponse {
  items: AdminUserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LoginHistoryItem {
  id: string;
  platform: "web" | "mobile";
  device: string | null;
  ip: string | null;
  user_agent: string | null;
  atTime: string; // ISO string
}

interface LoginHistoryResponse {
  user: {
    id: string;
    email: string;
    display_name: string;
  };
  items: LoginHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminUsers = () => {
  // bảng chính
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<UserStatusTab>("active");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  // drawer chi tiết + lịch sử đăng nhập
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<LoginHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  // MODAL TẠO/SỬA USER
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const fetchUsers = async (opts?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: UserStatusTab;
    role?: Role | "all";
  }) => {
    const currentSearch = opts?.search ?? search;
    const currentPage = opts?.page ?? page;
    const currentLimit = opts?.limit ?? limit;
    const currentStatus = opts?.status ?? activeTab;
    const currentRole = opts?.role ?? roleFilter;

    setLoading(true);
    try {
      const res = await API.get("/admin/users", {
        params: {
          search: currentSearch || undefined,
          page: currentPage,
          limit: currentLimit,
          status: currentStatus, // "active" | "inactive"
          role: currentRole === "all" ? undefined : currentRole,
        },
      });

      const dataRes: ListUsersResponse = res.data.data;
      setUsers(dataRes.items || []);
      setPage(dataRes.pagination.page);
      setLimit(dataRes.pagination.limit);
      setTotal(dataRes.pagination.total);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.msg ??
        "Lỗi trong khi tải danh sách người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // đổi tab -> load lại với status mới

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchUsers({ search: value, page: 1 });
  };

  const handleRoleFilterChange = (value: Role | "all") => {
    setRoleFilter(value);
    fetchUsers({ role: value, page: 1 });
  };

  const handleSoftDelete = async (id: string) => {
    try {
      // Với BE hiện tại: DELETE = soft delete (is_active=false)
      await API.delete(`/admin/users/${id}`);
      toast.success("Đã ngừng hoạt động (xoá mềm) người dùng");

      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.msg ?? "Xoá mềm người dùng thất bại"
      );
    }
  };

  const handleToggleActive = async (id: string, nextActive: boolean) => {
    try {
      await API.patch(`/admin/users/${id}/status`, {
        is_active: nextActive,
      });
      toast.success(
        nextActive ? "Đã khôi phục người dùng" : "Đã ngừng hoạt động người dùng"
      );

      // Có thể refetch cho chắc
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.msg ?? "Cập nhật trạng thái người dùng thất bại"
      );
    }
  };

  const openUserDrawer = async (record: AdminUserRow) => {
    setSelectedUser(record);
    setDrawerOpen(true);
    setDetailLoading(true);
    setHistoryLoading(true);
    setHistoryPage(1);

    try {
      // Option: nếu cần load detail chuẩn từ BE:
      const [detailRes, historyRes] = await Promise.all([
        API.get(`/admin/users/${record._id}`),
        API.get(`/admin/users/${record._id}/login-history`, {
          params: { page: 1, limit: historyLimit },
        }),
      ]);

      const detailFromApi: AdminUserRow = {
        ...record,
        ...detailRes.data.data,
        id: detailRes.data.data._id ?? detailRes.data.data.id ?? record._id,
      };
      setSelectedUser(detailFromApi);

      const historyData: LoginHistoryResponse = historyRes.data.data;
      setHistoryItems(historyData.items || []);
      setHistoryPage(historyData.pagination.page);
      setHistoryLimit(historyData.pagination.limit);
      setHistoryTotal(historyData.pagination.total);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.msg ?? "Không tải được chi tiết người dùng"
      );
    } finally {
      setDetailLoading(false);
      setHistoryLoading(false);
    }
  };

  const fetchHistoryPage = async (page: number, limit: number) => {
    if (!selectedUser) return;
    setHistoryLoading(true);
    try {
      const res = await API.get(
        `/admin/users/${selectedUser._id}/login-history`,
        {
          params: { page, limit },
        }
      );
      const historyData: LoginHistoryResponse = res.data.data;
      setHistoryItems(historyData.items || []);
      setHistoryPage(historyData.pagination.page);
      setHistoryLimit(historyData.pagination.limit);
      setHistoryTotal(historyData.pagination.total);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.msg ?? "Không tải được lịch sử đăng nhập"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: TableProps<AdminUserRow>["columns"] = [
    {
      title: "Người dùng",
      dataIndex: "display_name",
      key: "display_name",
      render: (_text, record) => (
        <div className="flex items-center gap-2">
          {record.avatar_url ? (
            <img
              src={record.avatar_url}
              alt={record.display_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
              {record.display_name?.[0]?.toUpperCase() ??
                record.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{record.display_name}</div>
            <div className="text-xs text-slate-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      render: (roles: Role[]) => (
        <Space size="small">
          {roles.includes("user") && <Tag>user</Tag>}
          {roles.includes("admin") && <Tag color="gold">admin</Tag>}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (is_active: boolean) =>
        is_active ? (
          <Tag color="green">Đang hoạt động</Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: "Lần đăng nhập cuối",
      dataIndex: "last_login",
      key: "last_login",
      render: (last_login: AdminUserRow["last_login"]) => {
        if (!last_login || !last_login.atTime) {
          return (
            <span className="text-xs text-slate-400 italic">Chưa có dữ liệu</span>
          );
        }
        const d = new Date(last_login.atTime);
        return (
          <div className="text-xs">
            <div>{d.toLocaleString("vi-VN")}</div>
            {last_login.device && (
              <div className="text-slate-500">{formatDeviceLabel(last_login.device)}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "IP",
      dataIndex: "last_login",
      key: "last_login",
      render: (last_login: AdminUserRow["last_login"]) => {
        return <span className="text-md font-medium text-red-600">{last_login.ip}</span>
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => {
        if (!value) {
          return (
            <span className="text-xs text-slate-400 italic">N/A</span>
          );
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return (
            <span className="text-xs text-slate-400 italic">N/A</span>
          );
        }
        return date.toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_text, record) => (
        <Space>
          {/* Xem chi tiết + lịch sử đăng nhập */}
          <Button
            type="link"
            variant="filled"
            color="blue"
            onClick={() => openUserDrawer(record)}
            icon={<Eye className="w-4 h-4" />}
          >
            Chi tiết
          </Button>
          {/* Cho phép chỉnh role bằng modal edit */}
          <Button
            type="link"
            variant="filled"
            color="green"
            onClick={() => {
              setUserModalMode("edit");
              setEditingUser(record);
              setUserModalOpen(true);
            }}
          >
            Sửa vai trò
          </Button>
          {/* Tab active: cho phép xoá mềm (DELETE) / ngừng hoạt động */}
          {activeTab === "active" ? (
            <Popconfirm
              title="Xoá mềm người dùng"
              description="Bạn có chắc muốn ngừng hoạt động người dùng này?"
              okText="Đồng ý"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleSoftDelete(record._id)}
            >
              <Button
                variant="filled"
                type="link"
                color="danger"
                danger>
                Ngừng hoạt động
              </Button>
            </Popconfirm>
          ) : (
            // Tab inactive: nút khôi phục
            <Popconfirm
              title="Khôi phục người dùng"
              description="Bạn có chắc muốn khôi phục người dùng này?"
              okText="Khôi phục"
              cancelText="Huỷ"
              onConfirm={() => handleToggleActive(record._id, true)}
            >
              <Button
                variant="filled"
                color="blue"
                type="link">
                Khôi phục
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const tabItems: TabsProps["items"] = [
    { key: "active", label: "Đang hoạt động" },
    { key: "inactive", label: "Ngừng hoạt động" },
  ];

  const handleTabChange = (key: string) => {
    const k = key as UserStatusTab;
    setActiveTab(k);
    setPage(1);
    fetchUsers({ status: k, page: 1 });
  };

  return (
    <div className="space-y-2">
      {/* Thanh filter / search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input.Search
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="max-w-[320px]"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
          />

          <Select
            className="w-[180px]"
            value={roleFilter}
            onChange={handleRoleFilterChange}
            options={[
              { value: "all", label: "Tất cả vai trò" },
              { value: "user", label: "Chỉ user" },
              { value: "admin", label: "Chỉ admin" },
            ]}
          />

          {/* Nếu sau này muốn tạo user từ admin thì bật nút này */}
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setUserModalMode("create");
              setEditingUser(null);
              setUserModalOpen(true);
            }}
          >
            Tạo user thủ công
          </Button>
        </div>
      </div>

      {/* Bảng users + tab */}
      <div className="bg-white rounded-lg shadow p-4">
        <Table<AdminUserRow>
          title={() => (
            <Tabs
              items={tabItems}
              activeKey={activeTab}
              onChange={handleTabChange}
            />
          )}
          loading={loading}
          columns={columns}
          dataSource={users}
          rowKey={(record) => record._id}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
              fetchUsers({ page: p, limit: l });
            },
          }}
        />
      </div>

      {/* Drawer chi tiết user + lịch sử đăng nhập */}
      <Drawer
        width={520}
        title="Chi tiết người dùng"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUser(null);
          setHistoryItems([]);
        }}
      >
        {detailLoading || !selectedUser ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : (
          <>
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: 140 }}
            >
              <Descriptions.Item label="Tên hiển thị">
                {selectedUser.display_name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {selectedUser.roles.includes("admin") ? (
                  <Space>
                    <Tag>user</Tag>
                    <Tag color="gold">admin</Tag>
                  </Space>
                ) : (
                  <Tag>user</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedUser.is_active ? (
                  <Tag color="green">Đang hoạt động</Tag>
                ) : (
                  <Tag color="red">Ngừng hoạt động</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Lần đăng nhập cuối">
                {selectedUser.last_login?.atTime ? (
                  <div className="flex flex-col items-start justify-start">
                    {new Date(
                      selectedUser.last_login.atTime
                    ).toLocaleString("vi-VN")}
                    {selectedUser.last_login.device && (
                      <span className="ml-2 text-xs text-slate-500">
                        Thiết bị: {formatDeviceLabel(selectedUser.last_login.device)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Chưa có dữ liệu
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(selectedUser.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-4 font-semibold">Lịch sử đăng nhập</div>
            <Table<LoginHistoryItem>
              className="mt-2"
              size="small"
              loading={historyLoading}
              dataSource={historyItems}
              rowKey={(r) => r.id}
              columns={[
                {
                  title: "Thời gian",
                  dataIndex: "atTime",
                  key: "atTime",
                  render: (v: string) =>
                    new Date(v).toLocaleString("vi-VN"),
                },
                {
                  title: "Platform",
                  dataIndex: "platform",
                  key: "platform",
                  render: (p: string) =>
                    p === "web" ? "Web" : "Mobile",
                },
                {
                  title: "Thiết bị",
                  dataIndex: "device",
                  key: "device",
                  render: (d: string | null) =>
                    formatDeviceLabel(d) || (
                      <span className="text-xs text-slate-400 italic">
                        N/A
                      </span>
                    ),
                },
                {
                  title: "IP",
                  dataIndex: "ip",
                  key: "ip",
                  render: (ip: string | null) =>
                    ip || (
                      <span className="text-xs text-slate-400 italic">
                        N/A
                      </span>
                    ),
                },
              ]}
              pagination={{
                current: historyPage,
                pageSize: historyLimit,
                total: historyTotal,
                size: "small",
                onChange: (p, l) => {
                  fetchHistoryPage(p, l);
                },
              }}
            />
          </>
        )}
      </Drawer>
      <AdminUserModal
        open={userModalOpen}
        mode={userModalMode}
        editingUser={editingUser || undefined}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSaved={(user) => {
          if (userModalMode === "create") {
            setUsers((prev) => [user, ...prev]);
          } else {
            setUsers((prev) =>
              prev.map((u) => (u._id === user._id ? user : u))
            );
            if (selectedUser && selectedUser._id === user._id) {
              setSelectedUser(user);
            }
          }
        }}
      />
    </div>
  );
};

export default AdminUsers;
