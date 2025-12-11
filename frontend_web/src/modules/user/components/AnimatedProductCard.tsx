// src/pages/components/AnimatedProductCard.tsx
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/types/product";
import { Tag } from "antd";

interface Props {
  product: ProductListItem;
}
type CatalogProduct = {
  product_id: string;
  slug: string;
  product_name: string;
  thumbnail_url: string | null;
  min_price: number;
  max_price?: number | null;
  has_discount?: boolean;
  discount_percent?: number;
  // ⚠️ chỗ này: field để thêm vào giỏ
  default_variant_id?: string;
};
interface AnimatedProductCardProps {
  product: CatalogProduct;
  onAddToCart?: () => void;
  isAdding?: boolean;
}
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

export const AnimatedProductCard = ({ product }: Props) => {
  const {
    product_id,
    slug,
    thumbnail_url,
    product_name,
    rating_avg,
    review_count,
    brand_name,
    brand_logo_url,
    price,
    total_stock,
    selled_amount,
    discount_percent,
    // optional: BE có thể trả thêm label cho badge
    promo_badge,
  } = product as ProductListItem & { promo_badge?: string };

  const hasDiscount = discount_percent > 0;

  // Tính giá gốc từ % giảm (xấp xỉ, chỉ để hiển thị)
  const originalPrice = hasDiscount
    ? Math.round(price / (1 - discount_percent / 100))
    : price;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 h-full flex flex-col border-0">
        <Link to={`/products/${slug}/${product_id}`}>
          {/* Khu logo brand phía trên */}
          <div className="h-19 pt-5 flex items-center justify-center bg-white">
            {brand_logo_url ? (
              <img
                src={brand_logo_url}
                alt={brand_name ?? ""}
                className="max-h-20 object-contain"
              />
            ) : (
              brand_name && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {brand_name}
                </span>
              )
            )}
          </div>

          {/* Khu ảnh sản phẩm + badge góc phải trên */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {/* Badge sắp hết hạn / new collection */}
            {total_stock < 10 && (
              <Badge
                className="absolute bottom-4 right-4 bg-destructive text-destructive-foreground shadow-lg animate-pulse"
              >
                Chỉ còn {total_stock}
              </Badge>
            )}

            <img
              src={
                thumbnail_url ||
                "https://via.placeholder.com/400x400?text=No+Image"
              }
              alt={product_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </Link>

        <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
          {/* Tên + % giảm */}
          <div className="flex items-start justify-between gap-2">
            <Link to={`/products/${slug}/${product_id}`} className="flex-1">
              <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {product_name}
              </h3>
            </Link>
            {hasDiscount && (
              <Tag
                color={"error"}
                className="text-[13px] font-semibold">
                -{discount_percent}%
              </Tag>
            )}
          </div>

          {/* Rating + đã bán */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-medium text-sm">
              {rating_avg?.toFixed(1) ?? "0.0"}
            </span>
            <span className="text-xs opacity-80">({review_count})</span>
            <span className="mx-1">•</span>
            <span>Đã bán {selled_amount}</span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            {/* Giá gốc gạch ngang + giá hiện tại */}
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-xl font-bold text-primary">
                {formatPrice(price)}
              </span>
            </div>

            {total_stock < 10 && (
              <span className="text-xs text-destructive">
                Chỉ còn {total_stock} sản phẩm
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
