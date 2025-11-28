import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';

class CheckoutArgs {
  final List<String>? cartItemIds;
  final Map<String, dynamic>? directItem;

  /// case đi từ giỏ hàng
  CheckoutArgs.fromCart({required List<String> cartItemIds})
    : cartItemIds = cartItemIds,
      directItem = null;

  /// case "Mua ngay" từ product detail
  CheckoutArgs.direct({required String variantId, required int quantity})
    : cartItemIds = null,
      directItem = {'variant_id': variantId, 'quantity': quantity};
}

class PaymentResultArgs {
  final String status; // success | failed | error
  final String orderId;
  final PaymentMethodMobile method;

  PaymentResultArgs({
    required this.status,
    required this.orderId,
    required this.method,
  });
}

/// Args cho màn WebView VNPay
class VnpayArgs {
  final String orderId;
  final String paymentUrl;

  VnpayArgs({required this.orderId, required this.paymentUrl});
}
