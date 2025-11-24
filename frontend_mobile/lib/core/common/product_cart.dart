import 'package:flutter/material.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.onTap});

  final ProductListItem product;
  final VoidCallback? onTap;

  String _formatPrice(int price) {
    // 3000000 -> 3.000.000đ
    return '${price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context) {
    final currentPriceText = _formatPrice(product.price);
    final originalPriceText =
        product.hasDiscount && product.originalPrice != null
        ? _formatPrice(product.originalPrice!)
        : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ====== Logo brand phía trên (giống web) ======
            if (product.brandLogoUrl != null || product.brandName != null)
              Container(
                height: 32,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                alignment: Alignment.centerLeft,
                child:
                    product.brandLogoUrl != null &&
                        product.brandLogoUrl!.isNotEmpty
                    ? Image.network(
                        product.brandLogoUrl!,
                        height: 20,
                        fit: BoxFit.contain,
                      )
                    : Text(
                        product.brandName ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey,
                        ),
                      ),
              ),

            // ====== Ảnh + badge giảm giá / sắp hết ======
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: Image.network(
                        product.thumbnailUrl,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),

                  // badge -% góc trái trên
                  if (product.hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '-${product.discountPercent}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                  // badge sắp hết hàng
                  if (product.totalStock < 10)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Còn ${product.totalStock}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // ====== Tên sản phẩm ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 2),
              child: Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13),
              ),
            ),

            // ====== Giá (gốc gạch + giá hiện tại) ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 2),
              child: Row(
                children: [
                  if (originalPriceText != null)
                    Text(
                      originalPriceText,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  if (originalPriceText != null) const SizedBox(width: 4),
                  Text(
                    currentPriceText,
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            // ====== Rating + đã bán ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
              child: Row(
                children: [
                  const Icon(Icons.star, color: Colors.orange, size: 12),
                  const SizedBox(width: 2),
                  Text(
                    product.ratingAvg.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 11),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '(${product.reviewCount})',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Đã bán ${product.selledAmount}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
