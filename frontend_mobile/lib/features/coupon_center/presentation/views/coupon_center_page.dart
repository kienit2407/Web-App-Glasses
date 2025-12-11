// lib/features/coupon_center/presentation/views/coupon_center_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/common/alert_dialog.dart';
import 'package:frontend_mobile/core/common/count_down_promo.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/utils/animated_dialog.dart';
import 'package:frontend_mobile/features/coupon_center/data/models/coupon_center_models.dart';
import 'package:go_router/go_router.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

class CouponCenterPage extends ConsumerWidget {
  const CouponCenterPage({super.key});

  String _formatPrice(int v) {
    return '${v.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(couponCenterControllerProvider);
    final controller = ref.read(couponCenterControllerProvider.notifier);
    final authState = ref.watch(authControllerProvider);
    final authUser = authState.valueOrNull;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        title: const Text(
          'Ưu đãi & Voucher',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      backgroundColor: const Color(0xfffafafa),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator.adaptive())
          : RefreshIndicator.adaptive(
              onRefresh: () => controller.loadAll(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 120),
                children: [
                  const Text(
                    'Lưu voucher và theo dõi các chương trình khuyến mãi đang diễn ra.',
                    style: TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),

                  // Promotions
                  if (state.promotions.isNotEmpty) ...[
                    const Text(
                      'Chương trình khuyến mãi',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // extent
                    // builder
                    MasonryGridView.count(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      physics: const NeverScrollableScrollPhysics(), // vì đang nằm trong ListView
                      crossAxisCount: 2,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      itemCount: state.promotions.length,
                      itemBuilder: (context, index) {
                        final p = state.promotions[index];
                        return _PromotionCard(
                          promotion: p,
                          formatPrice: _formatPrice,
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    // GridView.builder(
                    //   shrinkWrap: true,
                    //   gridDelegate:
                    //       const SliverGridDelegateWithFixedCrossAxisCount(
                    //         crossAxisCount: 2,
                    //         crossAxisSpacing: 8,
                    //         mainAxisSpacing: 8,
                    //         childAspectRatio: 0.48,
                    //       ),
                    //   itemCount: state.promotions.length,
                    //   itemBuilder: (context, index) {
                    //     final p = state.promotions[index];
                    //     return _PromotionCard(
                    //       promotion: p,
                    //       formatPrice: _formatPrice,
                    //     );
                    //   },
                    // ),
                  ],

                  // Vouchers
                  const Text(
                    'Voucher của shop',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  if (state.coupons.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(
                        child: Text(
                          'Hiện tại shop chưa có voucher nào.',
                          style: TextStyle(fontSize: 13, color: Colors.black54),
                        ),
                      ),
                    )
                  else
                    Column(
                      children: state.coupons
                          .map(
                            (c) => _CouponCard(
                              coupon: c,
                              saving: state.savingCouponId == c.id,
                              onSave: () async {
                                if (authUser == null) {
                                  // Chưa đăng nhập -> chuyển qua màn login
                                  if (context.mounted) {
                                    showAnimatedDialog(
                                      context: context,
                                      dialog: AppAlertDialog(
                                        content: "Bạn cần đăng nhập để lưu voucher",
                                        title: 'Warning!',
                                      ),
                                    );
                                  }
                                  return;
                                }

                                try {
                                  await controller.saveCoupon(c);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Đã lưu voucher vào kho của bạn',
                                        ),
                                      ),
                                    );
                                  }
                                } catch (_) {
                                  // lỗi đã show bằng snackbar phía trên
                                }
                              },
                              formatPrice: _formatPrice,
                            ),
                          )
                          .toList(),
                    ),

                  const SizedBox(height: 12),
                  const Text(
                    'Các voucher đã lưu có thể xem lại và sử dụng ở trang "Voucher của tôi" hoặc trong bước thanh toán.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
    );
  }
}

class _PromotionCard extends StatelessWidget {
  const _PromotionCard({required this.promotion, required this.formatPrice});

  final PromotionCenterItem promotion;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    final hsd = promotion.endDate != null
        ? '${promotion.endDate!.day}/${promotion.endDate!.month}/${promotion.endDate!.year}'
        : 'Không giới hạn';

    final discountText = promotion.discountType == 'percent'
        ? 'Giảm ${promotion.discountValue}%'
        : 'Giảm ${formatPrice(promotion.discountValue)}';

    return Card(
      clipBehavior: Clip.hardEdge,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.orange.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (promotion.bannerUrl != null)
            AspectRatio(
              aspectRatio: 3 / 4, // banner full, tỷ lệ 16:9
              child: Image.network(
                promotion.bannerUrl!,
                width: double.infinity,
                fit: BoxFit.cover, // fill + crop
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  promotion.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                if (promotion.description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    promotion.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: Colors.black54),
                  ),
                ],
                const SizedBox(height: 6),
                Text(
                  'Ưu đãi: $discountText'
                  '${promotion.maxDiscount != null ? ' (tối đa ${formatPrice(promotion.maxDiscount!)})' : ''}',
                  style: const TextStyle(fontSize: 11),
                ),
                Text(
                  'Đơn tối thiểu: ${promotion.minOrder != null ? formatPrice(promotion.minOrder!) : 'Không yêu cầu'}',
                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                ),
                Text(
                  'HSD: $hsd',
                  style: const TextStyle(fontSize: 10, color: Colors.black54),
                ),
                const SizedBox(height: 6),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: PromotionCountdownChip(
                    startDate: promotion.startDate,
                    endDate: promotion.endDate,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({
    required this.coupon,
    required this.saving,
    required this.onSave,
    required this.formatPrice,
  });

  final CouponCenterItem coupon;
  final bool saving;
  final VoidCallback onSave;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    final hsd = coupon.endDate != null
        ? '${coupon.endDate!.day}/${coupon.endDate!.month}/${coupon.endDate!.year}'
        : 'Không giới hạn';

    final discountText = coupon.type == 'percent'
        ? 'Giảm ${coupon.value}%'
        : 'Giảm ${formatPrice(coupon.value)}';

    final disabled = coupon.isSaved || saving;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.blue.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.local_offer, color: AppColor.buttonprimaryCol),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    discountText,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Đơn tối thiểu: ${coupon.minOrder != null ? formatPrice(coupon.minOrder!) : '0đ'}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  Text(
                    'HSD: $hsd',
                    style: const TextStyle(fontSize: 11, color: Colors.black54),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: disabled ? null : onSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: coupon.isSaved
                    ? Colors.grey.shade300
                    : AppColor.buttonprimaryCol,
                foregroundColor: coupon.isSaved ? Colors.black87 : Colors.white,
              ),
              child: saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(coupon.isSaved ? 'Đã lưu' : 'Lưu'),
            ),
          ],
        ),
      ),
    );
  }
}
