import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/checkout/data/model/checkout_models.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_controller.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';
import 'package:frontend_mobile/features/coupon/data/model/user_coupon_model.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';

class CheckoutPage extends ConsumerWidget {
  const CheckoutPage({super.key, required this.args});
  final CheckoutArgs args;

  String _formatPrice(int v) {
    return '${v.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(checkoutControllerProvider(args));
    final controller = ref.read(checkoutControllerProvider(args).notifier);

    // loading lần đầu
    if ((state.isInitLoading || state.isPreviewLoading) &&
        state.preview == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator.adaptive()),
      );
    }

    // chưa có địa chỉ -> bắt user tạo
    if (state.selectedAddress == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Checkout',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          foregroundColor: Colors.white,
          backgroundColor: AppColor.buttonprimaryCol,
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Bạn chưa có địa chỉ nhận hàng'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  context.push('/address-form');
                },
                child: const Text('Thêm địa chỉ'),
              ),
            ],
          ),
        ),
      );
    }

    final preview = state.preview;
    if (preview == null) {
      return Scaffold(
        body: Center(
          child: Text(
            'Không tải được thông tin thanh toán\n\n${state.errorMessage ?? ''}',
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xfffafafa),
      appBar: AppBar(
        title: const Text(
          'Checkout',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        foregroundColor: Colors.white,
        backgroundColor: AppColor.buttonprimaryCol,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
              children: [
                _AddressCard(
                  address: state.selectedAddress!,
                  onChange: () async {
                    final res = await context.push('/address-select');
                    if (res is Address) {
                      controller.changeAddress(res);
                    }
                  },
                ),
                const SizedBox(height: 8),
                _ItemsCard(preview: preview, formatPrice: _formatPrice),
                const SizedBox(height: 8),
                _VoucherCard(
                  state: state,
                  preview: preview,
                  formatPrice: _formatPrice,
                  onCouponChanged: controller.changeCouponInput,
                  onApply: controller.applyCoupon,
                  onClear: controller.clearCoupon,
                  onOpenCouponList: () {
                    _showCouponBottomSheet(
                      context: context,
                      subtotal: preview.subtotal,
                      controller: controller,
                      formatPrice: _formatPrice,
                    );
                  },
                ),
                const SizedBox(height: 8),
                _NoteCard(note: state.note, onChanged: controller.changeNote),
                const SizedBox(height: 8),
                _PaymentMethodCard(
                  method: state.paymentMethod,
                  onChange: controller.changePaymentMethod,
                ),
                const SizedBox(height: 8),
                _PriceSummaryCard(preview: preview, formatPrice: _formatPrice),
                const SizedBox(height: 80),
              ],
            ),
          ),
          _BottomSummaryBar(
            total: preview.totalAmount,
            isPlacing: state.isPlacingOrder,
            formatPrice: _formatPrice,
            onPlaceOrder: () async {
              try {
                final result = await controller.placeOrder();
                final paymentUrl = result['paymentUrl'];
                final orderId = result['orderId'];

                if (state.paymentMethod == PaymentMethodMobile.cod ||
                    paymentUrl == null) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đặt hàng thành công (Mã: $orderId)'),
                      ),
                    );
                    context.go('/home');
                  }
                } else {
                  // TODO: mở WebView / url_launcher với paymentUrl
                }
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đặt hàng thất bại, vui lòng thử lại'),
                    ),
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address, required this.onChange});

  final Address address;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      margin: EdgeInsets.zero,
      elevation: 0,
      // 1. Cắt hiệu ứng InkWell theo góc bo của Card
      clipBehavior: Clip.hardEdge,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        // 2. Đưa sự kiện onTap ra ngoài cùng để bấm đâu cũng ăn
        onTap: onChange,
        // Hiệu ứng màu khi bấm (tuỳ chọn)
        splashColor: Colors.redAccent.withOpacity(0.1),
        highlightColor: Colors.grey.withOpacity(0.1),

        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            // 3. Row cha: Căn giữa theo chiều dọc -> Để Icon Arrow nằm giữa
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // --- KHỐI NỘI DUNG BÊN TRÁI (ICON LOCATION + TEXT) ---
              Expanded(
                child: Row(
                  // Row con: Căn lên trên -> Để Icon Location ngang hàng với dòng chữ đầu
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(
                        top: 2,
                      ), // Chỉnh nhẹ để icon cân với text
                      child: Icon(
                        Icons.location_on,
                        color: Colors.redAccent,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Cột Text
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                color: Colors.black87,
                                fontSize: 14,
                              ),
                              children: [
                                TextSpan(
                                  text: address.recipientName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const TextSpan(text: ' '),
                                TextSpan(
                                  text: '(${address.phone})',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            address.specificAddress,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade700,
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2), // Bỏ bớt khoảng cách nếu thấy rời rạc
                          Text(
                            '${address.fullAddress}',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade700,
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (address.isDefault)
                            Container(
                              margin: const EdgeInsets.only(top: 6),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: Colors.redAccent,
                                  width: 0.5,
                                ),
                              ),
                              child: const Text(
                                'Mặc định',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.redAccent,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // --- KHỐI BÊN PHẢI (ICON ARROW) ---
              // Icon này sẽ tự động nằm giữa nhờ Row cha có CrossAxisAlignment.center
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// CARD SẢN PHẨM

class _ItemsCard extends StatelessWidget {
  const _ItemsCard({required this.preview, required this.formatPrice});

  final CheckoutPreview preview;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(
          children: [
            const ListTile(
              title: Text(
                'Sản phẩm',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            ...preview.items.map(
              (item) => ListTile(
                dense: true,
                title: Text(
                  item.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text('SL: ${item.quantity}'),
                trailing: Text(
                  formatPrice(item.total),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: Colors.red,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// CARD VOUCHER

class _VoucherCard extends StatelessWidget {
  const _VoucherCard({
    required this.state,
    required this.preview,
    required this.formatPrice,
    required this.onCouponChanged,
    required this.onApply,
    required this.onClear,
    required this.onOpenCouponList,
  });

  final CheckoutState state;
  final CheckoutPreview preview;
  final String Function(int) formatPrice;
  final ValueChanged<String> onCouponChanged;
  final Future<void> Function() onApply;
  final VoidCallback onClear;
  final VoidCallback onOpenCouponList;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Voucher',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    cursorColor: AppColor.buttonprimaryCol,
                    decoration: const InputDecoration(
                      hintText: 'Nhập mã giảm giá',
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(10)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(10)),
                        borderSide: BorderSide(
                          color: AppColor.buttonprimaryCol,
                        ),
                      ),
                    ),
                    onChanged: onCouponChanged,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppColor.buttonprimaryCol,
                  ),
                  onPressed: onApply,
                  child: const Text(
                    'Áp dụng',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: AppColor.buttonprimaryCol,
                    iconColor: AppColor.buttonprimaryCol,
                  ),
                  onPressed: onOpenCouponList,
                  child: Row(
                    spacing: 4,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text('Chọn voucher của bạn'),
                      Icon(Iconsax.arrow_right_1, size: 16),
                    ],
                  ),
                ),

                if (state.appliedCoupon != null)
                  TextButton(onPressed: onClear, child: const Text('Xoá')),
              ],
            ),
            if (state.appliedCoupon != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Đang áp dụng mã ${state.appliedCoupon!.code}',
                  style: const TextStyle(fontSize: 12, color: Colors.green),
                ),
              ),
            if (state.couponError != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  state.couponError!,
                  style: const TextStyle(fontSize: 12, color: Colors.red),
                ),
              ),

            // Thông tin nguồn giảm giá (coupon / promotion) giống web
            if (preview.discountAmount > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bạn tiết kiệm được ${formatPrice(preview.discountAmount)}',
                      style: const TextStyle(fontSize: 12, color: Colors.green),
                    ),
                    const SizedBox(height: 2),
                    if (preview.discountSource == 'promotion' &&
                        preview.appliedPromotion != null)
                      const Text(
                        'Đang áp dụng khuyến mãi tự động. Nếu mã giảm giá tốt hơn, hệ thống sẽ chọn mức giảm cao hơn.',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    if (state.appliedCoupon != null &&
                        preview.discountSource == 'promotion')
                      Text(
                        'Mã ${state.appliedCoupon!.code} không được áp dụng vì khuyến mãi hiện tại tốt hơn.',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.orange,
                        ),
                      ),
                    if (preview.discountSource == 'coupon' &&
                        preview.appliedCoupon != null)
                      Text(
                        'Nguồn giảm giá: mã ${preview.appliedCoupon!.code}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.green,
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

/// CARD NOTE

class _NoteCard extends StatelessWidget {
  const _NoteCard({required this.note, required this.onChanged});

  final String note;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Lời nhắn cho shop',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              cursorColor: AppColor.buttonprimaryCol,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Ghi chú (không bắt buộc)',
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                  borderSide: BorderSide(color: AppColor.buttonprimaryCol),
                ),
              ),
              onChanged: onChanged,
            ),
          ],
        ),
      ),
    );
  }
}

/// CARD PHƯƠNG THỨC THANH TOÁN

class _PaymentMethodCard extends StatelessWidget {
  const _PaymentMethodCard({required this.method, required this.onChange});

  final PaymentMethodMobile method;
  final ValueChanged<PaymentMethodMobile> onChange;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Phương thức thanh toán',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            RadioListTile<PaymentMethodMobile>(
              selectedTileColor: AppColor.buttonprimaryCol,

              activeColor: AppColor.buttonprimaryCol,
              value: PaymentMethodMobile.cod,
              groupValue: method,
              onChanged: (val) {
                if (val != null) onChange(val);
              },
              title: const Text('Thanh toán khi nhận hàng (COD)'),
            ),
            RadioListTile<PaymentMethodMobile>(
              value: PaymentMethodMobile.vnpay,
              activeColor: AppColor.buttonprimaryCol,
              selectedTileColor: AppColor.buttonprimaryCol,
              groupValue: method,
              onChanged: (val) {
                if (val != null) onChange(val);
              },
              title: const Text('Thanh toán qua VNPay'),
            ),
          ],
        ),
      ),
    );
  }
}

/// CARD TÓM TẮT GIÁ – HIỂN THỊ NGUỒN GIẢM GIÁ

class _PriceSummaryCard extends StatelessWidget {
  const _PriceSummaryCard({required this.preview, required this.formatPrice});

  final CheckoutPreview preview;
  final String Function(int) formatPrice;

  @override
  Widget build(BuildContext context) {
    String discountSourceText = 'Khác';
    if (preview.discountSource == 'coupon' && preview.appliedCoupon != null) {
      discountSourceText = 'Mã: ${preview.appliedCoupon!.code}';
    } else if (preview.discountSource == 'promotion' &&
        preview.appliedPromotion != null) {
      discountSourceText = 'KM: ${preview.appliedPromotion!.title}';
    } else if (preview.discountAmount == 0) {
      discountSourceText = 'Không có';
    }

    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Column(
          children: [
            _row('Tổng tiền hàng', formatPrice(preview.subtotal)),
            const SizedBox(height: 4),
            _row(
              'Giảm giá',
              '-${formatPrice(preview.discountAmount)}',
              valueColor: AppColor.buttomSecondCol,
            ),
            if (preview.discountAmount > 0)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: _row('Nguồn giảm', discountSourceText, isSmall: true),
              ),
            const SizedBox(height: 4),
            _row('Phí vận chuyển', formatPrice(preview.shippingFee)),
            const Divider(height: 16),
            _row(
              'Tổng thanh toán',
              valueColor: AppColor.buttomThirdCol,
              formatPrice(preview.totalAmount),
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(
    String label,
    String value, {
    Color? valueColor,
    bool isTotal = false,
    bool isSmall = false,
  }) {
    final baseStyle = TextStyle(fontSize: isSmall ? 11 : 13);
    final valueStyle = baseStyle.copyWith(
      color: valueColor,
      fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
      fontSize: isTotal ? 16 : (isSmall ? 11 : 13),
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: baseStyle),
        Text(value, style: valueStyle),
      ],
    );
  }
}

/// THANH ĐÁY ĐẶT HÀNG

class _BottomSummaryBar extends StatelessWidget {
  const _BottomSummaryBar({
    required this.total,
    required this.isPlacing,
    required this.formatPrice,
    required this.onPlaceOrder,
  });

  final int total;
  final bool isPlacing;
  final String Function(int) formatPrice;
  final VoidCallback onPlaceOrder;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tổng thanh toán', style: TextStyle(fontSize: 12)),
                  Text(
                    formatPrice(total),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SizedBox(
                height: 44,
                child: ElevatedButton(
                  onPressed: isPlacing ? null : onPlaceOrder,
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppColor.buttonprimaryCol,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  child: isPlacing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Đặt hàng',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
// ======= BOTTOM SHEET CHỌN VOUCHER =======

void _showCouponBottomSheet({
  required BuildContext context,
  required int subtotal,
  required CheckoutController controller,
  required String Function(int) formatPrice,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) {
      // Dùng Consumer để lấy ref trong bottom sheet
      return Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 12,
        ),
        child: Consumer(
          builder: (context, ref, _) {
            final state = ref.watch(userCouponControllerProvider(subtotal));

            if (state.isLoading && state.coupons.isEmpty) {
              return const SizedBox(
                height: 260,
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (state.errorMessage != null && state.coupons.isEmpty) {
              return SizedBox(
                height: 260,
                child: Center(
                  child: Text(
                    state.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              );
            }

            final coupons = state.coupons;
            if (coupons.isEmpty) {
              return const SizedBox(
                height: 260,
                child: Center(
                  child: Text(
                    'Bạn chưa có voucher nào.',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              );
            }

            return SizedBox(
              height: MediaQuery.of(ctx).size.height * 0.7,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(
                    child: SizedBox(width: 40, child: Divider(thickness: 3)),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Voucher của bạn',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: coupons.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final c = coupons[index];
                        final canUse = c.canUse && !c.isExpired;
                        final missing = c.missingAmount ?? 0;

                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: canUse
                                  ? Colors.deepPurple
                                  : Colors.grey.shade300,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      c.type == 'percent'
                                          ? 'Giảm ${c.value}%'
                                          : 'Giảm ${formatPrice(c.value)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Đơn tối thiểu: ${c.minOrder != null ? formatPrice(c.minOrder!) : '0đ'}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    if (missing > 0)
                                      Text(
                                        'Mua thêm ${formatPrice(missing)} để dùng voucher này',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Colors.redAccent,
                                        ),
                                      ),
                                    if (c.isExpired)
                                      const Text(
                                        'Voucher đã hết hạn',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.redAccent,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(4),
                                      color: Colors.blue.shade50,
                                    ),
                                    child: Text(
                                      c.code,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  ElevatedButton(
                                    onPressed: canUse
                                        ? () async {
                                            controller.changeCouponInput(
                                              c.code,
                                            );
                                            await controller.applyCoupon();
                                            Navigator.pop(ctx);
                                          }
                                        : null,
                                    child: Text(
                                      canUse ? 'Dùng' : 'Không đủ điều kiện',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    },
  );
}
