// lib/features/checkout/presentation/views/coupon_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';

class CouponPage extends ConsumerWidget {
  const CouponPage({super.key, required this.args});

  final CheckoutArgs args;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(checkoutControllerProvider(args));
    final controller = ref.read(checkoutControllerProvider(args).notifier);

    final textCtrl = TextEditingController(text: state.couponInput);

    return Scaffold(
      appBar: AppBar(title: const Text('Chọn voucher')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: textCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Nhập mã voucher',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onChanged: controller.changeCouponInput,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () async {
                    await controller.applyCoupon();
                    final newState = ref.read(checkoutControllerProvider(args));
                    if (newState.appliedCoupon != null &&
                        newState.couponError == null &&
                        context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('Áp dụng'),
                ),
              ],
            ),
          ),
          if (state.couponError != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                state.couponError!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
          if (state.appliedCoupon != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Card(
                child: ListTile(
                  title: Text(
                    state.appliedCoupon!.code,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    'Giảm ${state.appliedCoupon!.type == 'percent' ? '${state.appliedCoupon!.value}%' : '${state.appliedCoupon!.value}đ'}',
                  ),
                  trailing: TextButton(
                    onPressed: () {
                      controller.clearCoupon();
                    },
                    child: const Text('Xoá'),
                  ),
                ),
              ),
            ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text(
              'Danh sách voucher khả dụng sẽ hiển thị ở đây (tuỳ API của bạn). '
              'Hiện tại chỉ hỗ trợ nhập mã thủ công.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }
}
