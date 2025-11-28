import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';
import 'package:go_router/go_router.dart';

class PaymentResultPage extends ConsumerWidget {
  const PaymentResultPage({super.key, required this.args});

  final PaymentResultArgs args;

  String _title() {
    if (args.status == 'success') {
      if (args.method == PaymentMethodMobile.cod) {
        return 'Đặt hàng thành công!';
      }
      return 'Thanh toán VNPay thành công!';
    } else if (args.status == 'failed') {
      return 'Thanh toán thất bại';
    }
    return 'Không xác định được kết quả thanh toán';
  }

  String _subTitle() {
    if (args.status == 'success') {
      return 'Mã đơn hàng: ${args.orderId}';
    } else if (args.status == 'failed') {
      return 'Mã đơn hàng: ${args.orderId}. Bạn có thể kiểm tra lại hoặc thử phương thức khác.';
    }
    return 'Vui lòng kiểm tra lại lịch sử đơn hàng của bạn.';
  }

  IconData _icon() {
    if (args.status == 'success') return Icons.check_circle_outline;
    if (args.status == 'failed') return Icons.error_outline;
    return Icons.warning_amber_outlined;
  }

  Color _iconColor(BuildContext context) {
    if (args.status == 'success') return Colors.green;
    if (args.status == 'failed') return Colors.red;
    return Colors.orange;
  }

  String _formatPrice(int price) {
    return '${price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalogState = ref.watch(catalogControllerProvider);

    // Nếu chưa có sản phẩm và không loading -> chủ động load giống Home
    if (!catalogState.isLoading && catalogState.products.isEmpty) {
      Future.microtask(
        () => ref.read(catalogControllerProvider.notifier).loadInitial(),
      );
    }

    return Scaffold(
      appBar: AppBar(
        foregroundColor: Colors.white,
        backgroundColor: AppColor.buttonprimaryCol,
        title: const Text(
          'Kết quả thanh toán',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 40),
            Icon(_icon(), size: 80, color: _iconColor(context)),
            const SizedBox(height: 16),
            Text(
              _title(),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                _subTitle(),
                style: const TextStyle(fontSize: 14, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),

            // nút xem chi tiết / về trang chủ
            Row(
              spacing: 10,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppColor.buttonprimaryCol,
                  ),
                  onPressed: () {
                    // TODO: sửa path chi tiết đơn hàng cho đúng với app của bạn
                    context.push('/orders/${args.orderId}');
                  },
                  child: const Text('Xem chi tiết đơn hàng'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppColor.buttonprimaryCol,
                  ),
                  onPressed: () {
                    context.go('/home');
                  },
                  child: const Text('Về trang chủ'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Divider(),

            // ====== GỢI Ý SẢN PHẨM GIỐNG HOME ======
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Align(
                alignment: Alignment.center,
                child: Text(
                  'Có thể bạn sẽ thích',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            if (catalogState.isLoading && catalogState.products.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (catalogState.products.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'Hiện chưa có gợi ý sản phẩm.',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: _SuggestedProductsGrid(
                  products: catalogState.products,
                  formatPrice: _formatPrice,
                ),
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// Grid 2 cột, lấy khoảng 4–6 sản phẩm đầu tiên từ catalog
class _SuggestedProductsGrid extends StatelessWidget {
  const _SuggestedProductsGrid({
    required this.products,
    required this.formatPrice,
  });

  final List<ProductListItem> products;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    // Lấy tối đa 6 sản phẩm để gọn màn
    final display = products.take(6).toList();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: display.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.63,
      ),
      itemBuilder: (context, index) {
        final p = display[index];
        return _SuggestedProductCard(product: p, formatPrice: formatPrice);
      },
    );
  }
}

class _SuggestedProductCard extends StatelessWidget {
  const _SuggestedProductCard({
    required this.product,
    required this.formatPrice,
  });

  final ProductListItem product;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    final currentPriceText = formatPrice(product.price);
    final originalPriceText = product.hasDiscount
        ? formatPrice(product.originalPrice)
        : null;

    return GestureDetector(
      onTap: () {
        // giống Home: mở trang chi tiết sản phẩm
        context.push('/product/${product.productId}');
      },
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
            // Logo brand hoặc chữ
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

            // Ảnh + badge
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Image.network(
                      product.thumbnailUrl,
                      fit: BoxFit.cover,
                    ),
                  ),
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
                ],
              ),
            ),

            // Tên
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 2),
              child: Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13),
              ),
            ),

            // Giá
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
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
          ],
        ),
      ),
    );
  }
}
