/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/products/AdminProducts.tsx
import { useEffect, useMemo, useState } from "react";
import { API } from "@/app/lib/axios-client";
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Tabs,
  message,
  Popconfirm,
  Image as AntImage,
  List,
  Pagination,
} from "antd";
import type { TableProps, TabsProps } from "antd";
import { MoreHorizontal, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductModal from "../components/ProductModal";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MobileActionSheet } from "../components/MobileActionSheet";

export interface AdminProductRow {
  id: string;
  thumbnail_url: string | null;
  product_name: string;
  slug: string;
  category_name: string;
  brand_name: string;
  for_gender: string;
  total_stock: number;
  selled_amount: number;
  is_active: boolean;
  createdAt: string;
}

type ProductTabKey = "" | "active" | "inactive" | "draft";

interface ListResponse {
  items: AdminProductRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const AdminProducts = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [openProductModal, setOpenProductModal] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"create" | "edit">("create");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<ProductTabKey>("active");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // action sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetItem, setSheetItem] = useState<AdminProductRow | null>(null);

  const fetchProducts = async (opts?: { tab?: ProductTabKey; q?: string; page?: number; limit?: number }) => {
    const currentTab = opts?.tab ?? activeTab;
    const currentQ = opts?.q ?? q;
    const currentPage = opts?.page ?? page;
    const currentLimit = opts?.limit ?? limit;

    setLoading(true);
    try {
      const res = await API.get(`/admin/products`, {
        params: {
          q: currentQ || undefined,
          status: currentTab,
          page: currentPage,
          limit: currentLimit,
        },
      });

      const dataRes: ListResponse = res.data.data;
      setProducts(dataRes.items ?? []);
      setPage(dataRes.pagination.page ?? currentPage);
      setLimit(dataRes.pagination.limit ?? currentLimit);
      setTotal(dataRes.pagination.total ?? 0);
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.msg ?? "Lỗi trong khi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDelete = async (id: string, force = false) => {
    setLoading(true);
    try {
      await API.delete(`/admin/products/${id}`, {
        params: force ? { force: true } : undefined,
      });

      message.success(force ? "Đã xoá sản phẩm vĩnh viễn" : "Đã ngừng bán sản phẩm");
      setSheetOpen(false);
      await fetchProducts();
    } catch (error: any) {
      console.error(error);
      message.error(
        error?.response?.data?.msg ??
          (force ? "Lỗi trong khi xoá vĩnh viễn sản phẩm" : "Lỗi trong khi ngừng bán sản phẩm")
      );
    } finally {
      setLoading(false);
    }
  };

  const genderLabel = (g: string) => {
    const map: Record<string, string> = {
      male: "Nam",
      female: "Nữ",
      unisex: "Unisex",
      kids: "Trẻ em",
    };
    return map[g] || g;
  };

  const columns: TableProps<AdminProductRow>["columns"] = useMemo(
    () => [
      {
        title: "Sản phẩm",
        dataIndex: "product_name",
        key: "product_name",
        render: (_text, record) => (
          <div>
            <div className="font-medium">{record.product_name}</div>
            <div className="text-xs text-slate-500">/{record.slug}</div>
          </div>
        ),
      },
      { title: "Danh mục", dataIndex: "category_name", key: "category_name" },
      { title: "Thương hiệu", dataIndex: "brand_name", key: "brand_name" },
      {
        title: "Đối tượng",
        dataIndex: "for_gender",
        key: "for_gender",
        render: (g: string) => genderLabel(g),
      },
      {
        title: "Tồn kho",
        dataIndex: "total_stock",
        key: "total_stock",
        render: (value: number) => <span className={value === 0 ? "text-red-500" : ""}>{value}</span>,
      },
      { title: "Đã bán", dataIndex: "selled_amount", key: "selled_amount" },
      {
        title: "Ảnh",
        dataIndex: "thumbnail_url",
        key: "thumbnail",
        align: "center",
        width: 100,
        render: (url, record) =>
          url ? (
            <AntImage
              src={url}
              alt={record.product_name}
              width={80}
              className="rounded-md object-cover hover:scale-110 shadow-lg shadow-blue-500/25 transition-transform duration-300 cursor-pointer"
              preview={{ mask: "Xem" }}
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
              N/A
            </div>
          ),
      },
      {
        title: "Trạng thái",
        dataIndex: "is_active",
        key: "is_active",
        render: (is_active: boolean) => (is_active ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Tạm ẩn</Tag>),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => {
          if (!value) return <span className="text-xs text-slate-400 italic">N/A</span>;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return <span className="text-xs text-slate-400 italic">N/A</span>;
          return date.toLocaleDateString("vi-VN");
        },
      },
      {
        title: "Action",
        align: "center",
        key: "action",
        render: (_text, record) => (
          <Space>
            <Button
              type="link"
              color="blue"
              variant="filled"
              onClick={() => navigate(`/admin/products/${record.id}/${record.slug}`)}
            >
              Xem chi tiết
            </Button>

            <Button
              type="link"
              color="green"
              variant="filled"
              onClick={() => {
                setProductModalMode("edit");
                setEditingProductId(record.id);
                setOpenProductModal(true);
              }}
            >
              Sửa
            </Button>

            <Popconfirm
              title={activeTab === "active" ? "Ngừng bán sản phẩm" : "Xoá vĩnh viễn"}
              description={
                activeTab === "active"
                  ? "Bạn có chắc muốn ngừng bán sản phẩm này?"
                  : "Bạn có chắc muốn xoá vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác."
              }
              okText={activeTab === "active" ? "Ngừng bán" : "Xoá"}
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id, activeTab !== "active")}
            >
              <Button color="danger" variant="filled">
                {activeTab === "active" ? "Ngừng bán" : "Xoá"}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [activeTab]
  );

  const handleSearch = (value: string) => {
    setQ(value);
    setPage(1);
    fetchProducts({ q: value, page: 1 });
  };

  const onTabChange = (key: string) => {
    const tabKey = key as ProductTabKey;
    setActiveTab(tabKey);
    setPage(1);
  };

  const tabItems: TabsProps["items"] = [
    { key: "active", label: "Đang bán" },
    { key: "inactive", label: "Ngừng bán" },
    { key: "draft", label: "Bản nháp" },
  ];

  return (
    <div className="space-y-2">
      {/* Search + Add */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-3`}>
          <Input.Search
            placeholder="Tìm kiếm sản phẩm..."
            className={isMobile ? "w-full" : "max-w-[300px]"}
            allowClear
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) handleSearch("");
            }}
          />

          <Button
            type="primary"
            className={isMobile ? "w-full" : ""}
            onClick={() => {
              setProductModalMode("create");
              setEditingProductId(null);
              setOpenProductModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-lg shadow p-4">
        <Tabs items={tabItems} activeKey={activeTab} onChange={onTabChange} />

        {isMobile ? (
          <>
            <List
              loading={loading}
              dataSource={products}
              renderItem={(item) => (
                <List.Item className="!px-0">
                  <div className="w-full rounded-lg border bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded bg-slate-100 overflow-hidden flex items-center justify-center">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{item.product_name}</div>
                        <div className="text-xs text-slate-500 truncate">/{item.slug}</div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {item.is_active ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Tạm ẩn</Tag>}
                          <Tag>{genderLabel(item.for_gender)}</Tag>
                        </div>

                        <div className="mt-1 text-xs text-slate-600 line-clamp-2">
                          <span className="text-slate-400">Danh mục:</span> {item.category_name} ·{" "}
                          <span className="text-slate-400">Thương hiệu:</span> {item.brand_name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Tồn kho: <b className={item.total_stock === 0 ? "text-red-500" : ""}>{item.total_stock}</b>{" "}
                          · Đã bán: <b>{item.selled_amount}</b>
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                        </div>
                      </div>

                      <Button
                        type="text"
                        onClick={() => {
                          setSheetItem(item);
                          setSheetOpen(true);
                        }}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <div className="pt-3 flex justify-end">
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger={false}
                onChange={(p) => {
                  setPage(p);
                  fetchProducts({ page: p });
                }}
              />
            </div>

            <MobileActionSheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              title={<span className="font-semibold">{sheetItem?.product_name}</span>}
            >
              <div className="space-y-2">
                <Button
                  block
                  onClick={() => {
                    if (!sheetItem) return;
                    navigate(`/admin/products/${sheetItem.id}/${sheetItem.slug}`);
                    setSheetOpen(false);
                  }}
                >
                  Xem chi tiết
                </Button>

                <Button
                  block
                  onClick={() => {
                    if (!sheetItem) return;
                    setProductModalMode("edit");
                    setEditingProductId(sheetItem.id);
                    setOpenProductModal(true);
                    setSheetOpen(false);
                  }}
                >
                  Sửa
                </Button>

                <Popconfirm
                  title={activeTab === "active" ? "Ngừng bán sản phẩm" : "Xoá vĩnh viễn"}
                  description={
                    activeTab === "active"
                      ? "Bạn có chắc muốn ngừng bán sản phẩm này?"
                      : "Bạn có chắc muốn xoá vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác."
                  }
                  okText={activeTab === "active" ? "Ngừng bán" : "Xoá"}
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => sheetItem?.id && handleDelete(sheetItem.id, activeTab !== "active")}
                >
                  <Button block danger>
                    {activeTab === "active" ? "Ngừng bán" : "Xoá vĩnh viễn"}
                  </Button>
                </Popconfirm>
              </div>
            </MobileActionSheet>
          </>
        ) : (
          <Table<AdminProductRow>
            loading={loading}
            columns={columns}
            dataSource={products}
            rowKey={(record) => record.id}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: (p, l) => {
                setPage(p);
                setLimit(l);
                fetchProducts({ page: p, limit: l });
              },
            }}
          />
        )}
      </div>

      <ProductModal
        open={openProductModal}
        mode={productModalMode}
        productId={productModalMode === "edit" ? editingProductId : null}
        onClose={() => {
          setOpenProductModal(false);
          setEditingProductId(null);
        }}
        onSaved={() => fetchProducts()}
      />
    </div>
  );
};

export default AdminProducts;
