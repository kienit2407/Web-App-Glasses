/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProductDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Image, Rate, Card, Typography, message, Popconfirm } from 'antd'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { API } from "@/app/lib/axios-client";
import { useCatalog } from "@/hooks/use-catalog";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { useReviews } from "@/hooks/use-reviews";
import { useAuth } from "@/hooks/use-auth";
import { ReviewModal } from "@/modules/user/components/ReviewModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";

const { Title, Text } = Typography;
type Variant = {
  variant_id: string;
  sku_variant: string;
  frame_material: string;
  frame_color: string;
  frame_shape: string;
  lens_width: string;
  lens_height: string;
  temple_length: string;
  bridge_width: string;
  stock: number;
  has_uv_protection: boolean;
  price: number;
  sale_price: number | null;
  is_active: boolean;
};

type ProductDetailPayload = {
  product: {
    product_id: string;
    product_name: string;
    slug: string;
    description: string;
    selled_amount: number;
    review_count: number;
    rating_avg: number;
    origin_country?: string;
    category_id: string;
    brand_id: string;
    tags: string[];
    thumbnail_url: string | null;
    thumbnail_id: string | null;
    createdAt: string;
    updatedAt: string;
  };
  variants: Variant[];
  images: {
    product: { image_id: string; url: string; url_id: string; position: number }[];
    byVariant: Record<
      string,
      { image_id: string; url: string; url_id: string; position: number }[]
    >;
  };
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

const ProductDetail = () => {
  // /products/:slug/:productId
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingDefault, setEditingDefault] = useState<{ rating: number; comment: string }>({
    rating: 5,
    comment: "",
  });
  const { addToCart, isUpdating } = useCart();
  const [data, setData] = useState<ProductDetailPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [isCopy, setCopy] = useState(false)
  const { user } = useAuth();
  const navigate = useNavigate()
  const currentUserId = useMemo(() => {
    if (!user) return null;
    // tuỳ cấu trúc user, ưu tiên id, fallback _id
    return String((user as any).id ?? (user as any)._id ?? "");
  }, [user]);
  // useEffect(() => {
  //   // Cuộn lên đầu mỗi khi danh sách sản phẩm thay đổi (do lọc hoặc phân trang)
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // }, [data]); // Thêm các dependency này
  const {
    items: reviews,
    avg_rating,
    isLoading: reviewLoading,
    fetchOfProduct,
    create: createReview,
    update: updateReview,
    remove: deleteReview,
  } = useReviews();
  // --- Lấy review của current user
  const myReview = useMemo(
    () =>
      reviews.find(
        (r) =>
          currentUserId && String(r.user_id?.id) === currentUserId
      ) ?? undefined,
    [reviews, currentUserId]
  );


  // đang edit hay không
  const isEditMode = !!editingReviewId;
  const handleBuyNow = () => {
    if (!selectedVariant) {
      toast.error("Vui lòng chọn biến thể trước khi mua ngay");
      return;
    }

    if (stock <= 0) {
      toast.error("Sản phẩm tạm hết hàng");
      return;
    }


    navigate("/checkout", {
      state: {
        directItem: {
          variant_id: selectedVariant.variant_id,
          quantity,
        },
      },
    });
  };
  // mở modal tạo review mới
  const openCreateReview = () => {
    setEditingReviewId(null);
    setEditingDefault({ rating: 5, comment: "" });
    setReviewModalOpen(true);
  };

  // mở modal sửa review hiện tại
  const openEditReview = () => {
    const review = myReview;
    if (!review) {
      toast.error("Không tìm thấy đánh giá để chỉnh sửa");
      return;
    }

    setEditingReviewId(review.id);
    setEditingDefault({
      rating: review.rating,
      comment: review.comment,
    });
    setReviewModalOpen(true);
  };

  // Hàm submit chung cho cả create + edit
  const handleSubmitReview = async (fd: FormData) => {
    try {
      if (editingReviewId) {
        // đang edit một review cụ thể
        await updateReview(editingReviewId, fd);
      } else if (myReview) {
        // đã có review trong DB nhưng editingReviewId = null → vẫn update
        await updateReview(myReview.id, fd);
      } else {
        // chưa có review nào → create mới
        await createReview(fd);
      }

      await fetchOfProduct(product.product_id);
      setEditingReviewId(null);
      setReviewModalOpen(false);
    } catch (error) {
      // toast đã xử lý trong hook
      console.error(error);
    }
  };
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Vui lòng chọn biến thể trước khi thêm vào giỏ hàng");
      return;
    }

    if (stock <= 0) {
      toast.error("Sản phẩm tạm hết hàng");
      return;
    }

    try {
      await addToCart(selectedVariant.variant_id, quantity);
    } catch (err) {
      console.error(err);
    }
  };

  const { bestSellerProducts, fetchHomeProducts } = useCatalog();

  useEffect(() => {
    fetchHomeProducts();
  }, [fetchHomeProducts]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const res = await API.get(`/catalog/products/${productId}`);
        const payload: ProductDetailPayload = res.data?.data;
        setData(payload);

        await fetchOfProduct(payload.product.product_id);

        if (payload.variants.length > 0) {
          const firstId = payload.variants[0].variant_id;
          setSelectedVariantId(firstId);

          const variantImgs = payload.images.byVariant[firstId] ?? [];
          const allImgs = [...variantImgs, ...payload.images.product];
          if (allImgs.length > 0) {
            setActiveImageUrl(allImgs[0].url);
          } else if (payload.product.thumbnail_url) {
            setActiveImageUrl(payload.product.thumbnail_url);
          }
        } else if (payload.product.thumbnail_url) {
          setActiveImageUrl(payload.product.thumbnail_url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [productId, fetchOfProduct]);
  
  const handleCopyLink = () => {
    // 1. Lấy đường dẫn chi tiết sản phẩm
    // Thường là URL hiện tại của trình duyệt
    const productUrl = window.location.href;

    // Hoặc nếu bạn muốn link ngắn gọn hơn, ví dụ:
    // const productUrl = `${window.location.origin}/products/${productId}`;

    // 2. Sử dụng Clipboard API để copy
    navigator.clipboard.writeText(productUrl)
    setCopy(true)
    message.success("Đã sao chép url sản phẩm")
    const timer = setTimeout(() => {
      setCopy(false); // Set state trở lại FALSE
    }, 3000); // Thời gian chờ là 3000 milliseconds (3 giây)

    // RẤT QUAN TRỌNG: Phải luôn dọn dẹp (clear) timer
    // để tránh lỗi memory leak hoặc chạy hàm không mong muốn
    // nếu component bị unmount trước khi timer kết thúc.
    // Đây là cách dọn dẹp tốt nhất trong React.
    return () => clearTimeout(timer);

  };
  const selectedVariant: Variant | null = useMemo(() => {
    if (!data || !selectedVariantId) return null;
    return data.variants.find((v) => v.variant_id === selectedVariantId) ?? null;
  }, [data, selectedVariantId]);

  const galleryImages = useMemo(() => {
    if (!data) return [];
    const variantImgs =
      (selectedVariantId && data.images.byVariant[selectedVariantId]) || [];
    const productImgs = data.images.product;
    const all = [...variantImgs, ...productImgs];

    if (all.length === 0 && data.product.thumbnail_url) {
      return [
        {
          image_id: "thumb",
          url: data.product.thumbnail_url,
          url_id: "",
          position: 0,
        },
      ];
    }
    return all;
  }, [data, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
          <Link to="/products">
            <Button>Quay lại danh sách sản phẩm</Button>
          </Link>
        </div>
      </div>
    );
  }
  console.log("reviews:", reviews);
  console.log("myReview:", myReview);
  console.log("editingReviewId:", editingReviewId);

  const { product, variants } = data;
  const rating = avg_rating || product.rating_avg || 0;
  const displayAvgRating = avg_rating || product.rating_avg || 0;
  const stock = selectedVariant?.stock ?? 0;
  const displayPrice =
    selectedVariant?.sale_price && selectedVariant.sale_price > 0
      ? selectedVariant.sale_price
      : selectedVariant?.price ?? 0;
  const originPrice = selectedVariant?.price ?? 0;
  const hasDiscount =
    selectedVariant?.sale_price &&
    selectedVariant.sale_price > 0 &&
    selectedVariant.sale_price < originPrice;

  const prettyNameFromSlug = slug
    ? slug.replace(/-/g, " ")
    : product.product_name;
  console.log("user from auth:", user);
  console.log("currentUserId:", currentUserId);
  console.log("reviews:", reviews);
  console.log("myReview:", myReview);
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">
            Sản phẩm
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">
            {product.product_name || prettyNameFromSlug}
          </span>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-muted shadow-soft">
              {activeImageUrl ? (
                <Image
                  style={{ display: "inline-block" }}
                  src={activeImageUrl}
                  className="w-full h-full object-cover rounded-md hover:scale-110 shadow-lg shadow-blue-500/25 transition-transform duration-300 cursor-pointer"
                  preview={{ mask: "Xem" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Không có ảnh
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="flex gap-3">
                {galleryImages.map((img) => (
                  <button
                    key={img.image_id}
                    className={`w-20 h-20 rounded border overflow-hidden ${activeImageUrl === img.url ? "border-primary" : "border-border"
                      }`}
                    onClick={() => setActiveImageUrl(img.url)}
                  >
                    <img
                      src={img.url}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary">Mã: {selectedVariant?.sku_variant || "—"}</Badge>
                <Badge variant="outline">
                  Đã bán {product.selled_amount ?? 0}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {product.product_name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <Rate
                  allowHalf
                  disabled
                  value={rating}
                  style={{ fontSize: 18 }}
                />
                <span className="text-sm text-muted-foreground">
                  {rating.toFixed(1)} ({product.review_count} đánh giá)
                </span>
              </div>

              <div className="flex items-end gap-3 mb-2">
                <p className="text-4xl font-bold text-primary">
                  {formatPrice(displayPrice)}
                </p>
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground line-through text-lg">
                      {formatPrice(originPrice)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -
                      {Math.round(
                        ((originPrice - (selectedVariant?.sale_price || 0)) /
                          originPrice) *
                        100
                      )}
                      %
                    </Badge>
                  </div>
                )}
              </div>

              {stock < 20 && (
                <p className="text-sm text-destructive">
                  Chỉ còn {stock} sản phẩm
                </p>
              )}
            </div>

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Chọn biến thể</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <Button
                      key={v.variant_id}
                      size="sm"
                      variant={
                        v.variant_id === selectedVariantId
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedVariantId(v.variant_id)}
                    >
                      {v.frame_color} • {v.frame_shape} • {v.lens_width}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả ngắn */}
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Tags */}
            {!!product.tags?.length && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            {selectedVariant && (
              <div className="flex items-center">
                <div className="text-[14px] font-bold">Kích thước:</div>
                <Tag color="green" className="text-[13px] ml-2">
                  {selectedVariant.lens_width}-{selectedVariant.bridge_width}-{selectedVariant.temple_length}
                </Tag>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-semibold">Số lượng:</label>
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      className="px-4 py-2 hover:bg-muted transition-colors"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      -
                    </button>
                    <span className="px-6 py-2 font-semibold">{quantity}</span>
                    <button
                      className="px-4 py-2 hover:bg-muted transition-colors"
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(stock > 0 ? stock : 99, q + 1)
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || stock <= 0 || isUpdating}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {stock <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                  </Button>

                  <Button
                    size="lg"
                    className="flex-1"
                    variant="outline"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || stock <= 0 || isUpdating}
                  >
                    Mua ngay
                  </Button>
                  <Button
                    size="lg"
                    className="flex-5"
                    variant="outline"
                    onClick={handleCopyLink}
                  >

                    {isCopy ? (<Check />) : (<Share2 />)}
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border border-border rounded-lg p-6 space-y-4 bg-white">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Giao hàng miễn phí</h4>
                  <p className="text-sm text-muted-foreground">
                    Miễn phí ship cho đơn hàng trên 500K
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Bảo hành 12 tháng</h4>
                  <p className="text-sm text-muted-foreground">
                    Bảo hành chính hãng toàn quốc
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: mô tả & thông số kỹ thuật & đánh giá */}
        <Tabs defaultValue="description" className="mb-16 bg-white p-3 rounded-lg">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
            <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm max-w-none">
              <p>{product.description}</p>
              <h3>Đặc điểm nổi bật</h3>
              <ul>
                <li>Thiết kế hiện đại, phù hợp nhiều khuôn mặt</li>
                <li>Chất liệu cao cấp, bền đẹp theo thời gian</li>
                <li>Bảo vệ UV, an toàn cho mắt</li>
                <li>Đi kèm hộp đựng và khăn lau chuyên dụng</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold mb-2">Thông tin sản phẩm</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Chất liệu khung:</dt>
                    <dd className="font-medium">
                      {selectedVariant?.frame_material ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Màu khung:</dt>
                    <dd className="font-medium">
                      {selectedVariant?.frame_color ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dáng khung:</dt>
                    <dd className="font-medium">
                      {selectedVariant?.frame_shape ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Xuất xứ:</dt>
                    <dd className="font-medium">
                      {product.origin_country || "Đang cập nhật"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Bảo vệ UV:</dt>
                    <dd className="font-medium">
                      {selectedVariant?.has_uv_protection ? "Có" : "Không"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* khung size tĩnh giống ảnh bạn gửi */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold mb-2">Kích thước khung</h4>
                {/* chỗ này sau bạn thay bằng ảnh tĩnh của bạn */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Lens width
                    </span>
                    <span className="font-semibold">
                      {selectedVariant?.lens_width || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Bridge width
                    </span>
                    <span className="font-semibold">
                      {selectedVariant?.bridge_width || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Temple length
                    </span>
                    <span className="font-semibold">
                      {selectedVariant?.temple_length || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Header + nút viết / sửa */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {displayAvgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reviews.length} đánh giá
                </p>
              </div>

              {user && (
                <div className="flex gap-2">
                  {myReview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openEditReview}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Sửa đánh giá
                    </Button>
                  )}
                  {!myReview && (
                    <Button size="sm" onClick={openCreateReview}>
                      Viết đánh giá
                    </Button>
                  )}
                </div>
              )}
            </div>

            {reviewLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có đánh giá nào cho sản phẩm này
              </div>
            ) : (
              <Card>
                <div className="space-y-4">
                  {reviews.map((rv) => (
                    <div
                      key={rv.id}
                      className="border border-border rounded-lg p-4 flex gap-4"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rv.user_id?.avatar_url} />
                        <AvatarFallback>
                          {rv.user_id?.display_name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">
                              {rv.user_id?.display_name ?? "Người dùng"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex">
                                <Rate disabled allowHalf value={rv.rating} style={{ fontSize: 14 }} />
                              </div>
                              <span>
                                {new Date(rv.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                              {rv.is_edited && (
                                <Badge variant="outline" className="text-[10px]">
                                  Đã chỉnh sửa
                                </Badge>
                              )}
                            </div>
                          </div>

                          {currentUserId && currentUserId === String(rv.user_id?.id) && (
                            <div className="flex gap-1">
                              {/* nút sửa */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingReviewId(rv.id);
                                  setEditingDefault({
                                    rating: rv.rating,
                                    comment: rv.comment,
                                  });
                                  setReviewModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {/* nút xoá */}
                              <Popconfirm
                                title={"Xoá đánh giá"}
                                description={
                                  "Bạn có chắc muốn xoá đánh giá này không? Hành động này không thể hoàn tác."
                                }
                                okText={"Xoá đánh giá"}
                                cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                                onConfirm={
                                  async () => {
                                    await deleteReview(rv.id);
                                    await fetchOfProduct(product.product_id);
                                  }
                                }
                              >
                                <Button size="icon" variant="ghost">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </Popconfirm>
                            </div>
                          )}
                        </div>

                        <p className="text-sm">{rv.comment}</p>

                        {rv.images?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {rv.images.map((img) => (
                              <img
                                key={img.url_id ?? img.url}
                                src={img.url}
                                className="w-20 h-20 object-cover rounded-md border"
                              />
                            ))}
                          </div>
                        )}

                        {rv.video_url && (
                          <div className="mt-2">
                            <video
                              src={rv.video_url}
                              controls
                              className="w-full max-w-md rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {user && (
              <ReviewModal
                open={reviewModalOpen}
                mode={isEditMode || myReview ? "edit" : "create"}
                defaultRating={editingDefault.rating}
                defaultComment={editingDefault.comment}
                productId={product.product_id}
                existingImages={myReview?.images}
                existingVideoUrl={myReview?.video_url ?? null}
                onClose={() => {
                  setReviewModalOpen(false);
                  setEditingReviewId(null);
                }}
                onSubmit={handleSubmitReview}
              />
            )}

          </TabsContent>
        </Tabs>


        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Sản phẩm bạn có thể thích
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Những mẫu kính được yêu thích và đánh giá cao nhất tháng này
          </p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellerProducts.map((product, index) => (
                <AnimatedProductCard
                  key={product.product_id}
                  product={product}
                />
              ))}
            </div>
            <div
              className="text-center mt-16 animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <Link to="/products">
                <Button variant="hero" size="lg" className="group shadow-elegant">
                  Xem tất cả sản phẩm
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
