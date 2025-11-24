// lib/features/home/data/models/product_list_item.dart

class ProductListItem {
  final String productId;
  final String name;
  final String slug;
  final String thumbnailUrl;

  /// Giá đang bán (có thể đã áp dụng khuyến mãi)
  final int price;

  /// % giảm giá, 0 nếu không giảm
  final int discountPercent;

  /// Điểm trung bình
  final double ratingAvg;

  /// Số lượt đánh giá
  final int reviewCount;

  /// Số đã bán
  final int selledAmount;

  /// Tồn kho
  final int totalStock;

  /// Brand
  final String? brandName;
  final String? brandLogoUrl;

  ProductListItem({
    required this.productId,
    required this.name,
    required this.slug,
    required this.thumbnailUrl,
    required this.price,
    required this.discountPercent,
    required this.ratingAvg,
    required this.reviewCount,
    required this.selledAmount,
    required this.totalStock,
    required this.brandName,
    required this.brandLogoUrl,
  });

  bool get hasDiscount => discountPercent > 0;

  /// Giống web: originalPrice ≈ price / (1 - discount%)
  int get originalPrice {
    if (!hasDiscount) return price;
    final double factor = 1 - (discountPercent / 100.0);
    if (factor <= 0) return price;
    return (price / factor).round();
  }

  factory ProductListItem.fromJson(Map<String, dynamic> json) {
    final num? rawPrice = json['price'] as num?;
    final num? rawDiscount = json['discount_percent'] as num?;
    final num? rawRating = json['rating_avg'] as num?;
    final num? rawReviewCount = json['review_count'] as num?;
    final num? rawSelled = json['selled_amount'] as num?;
    final num? rawStock = json['total_stock'] as num?;

    return ProductListItem(
      productId: json['product_id'] as String? ?? '',
      name: json['product_name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      thumbnailUrl: json['thumbnail_url'] as String? ?? '',
      price: rawPrice?.toInt() ?? 0,
      discountPercent: rawDiscount?.toInt() ?? 0,
      ratingAvg: rawRating?.toDouble() ?? 0.0,
      reviewCount: rawReviewCount?.toInt() ?? 0,
      selledAmount: rawSelled?.toInt() ?? 0,
      totalStock: rawStock?.toInt() ?? 0,
      brandName: json['brand_name'] as String?,
      brandLogoUrl: json['brand_logo_url'] as String?,
    );
  }
}
