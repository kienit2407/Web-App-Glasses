// lib/features/checkout/data/checkout_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/checkout/model/checkout_models.dart';

class CheckoutRepository {
  final DioClient dioClient;

  CheckoutRepository(this.dioClient);

  Future<CheckoutPreview> previewCheckout({
    required String addressId,
    required List<String>? cartItemIds,
    required Map<String, dynamic>? directItem,
    String? couponCode,
  }) async {
    final body = <String, dynamic>{
      'address_id': addressId,
      if (couponCode != null && couponCode.isNotEmpty)
        'coupon_code': couponCode,
    };

    if (cartItemIds != null && cartItemIds.isNotEmpty) {
      body['cart_item_ids'] = cartItemIds;
    } else if (directItem != null) {
      body['items'] = [
        {
          'variant_id': directItem['variant_id'],
          'quantity': directItem['quantity'],
        },
      ];
    }

    final res = await dioClient.dio.post('/checkout/preview', data: body);

    final data = res.data['data'];

    // nếu sau này BE bọc thêm key "preview" thì vẫn chạy được
    final previewJson = data is Map<String, dynamic> && data['preview'] != null
        ? data['preview'] as Map<String, dynamic>
        : data as Map<String, dynamic>;

    return CheckoutPreview.fromJson(previewJson);
  }

  /// Tạo order thật
  Future<Map<String, dynamic>> createOrder({
    required String addressId,
    required List<String>? cartItemIds,
    required Map<String, dynamic>? directItem,
    String? couponCode,
    String? note,
  }) async {
    final body = <String, dynamic>{
      'address_id': addressId,
      if (couponCode != null && couponCode.isNotEmpty)
        'coupon_code': couponCode,
      if (note != null && note.isNotEmpty) 'note': note,
    };

    if (cartItemIds != null && cartItemIds.isNotEmpty) {
      body['cart_item_ids'] = cartItemIds;
    } else if (directItem != null) {
      body['items'] = [
        {
          'variant_id': directItem['variant_id'],
          'quantity': directItem['quantity'],
        },
      ];
    }

    final res = await dioClient.dio.post('/orders', data: body);
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<void> confirmCOD(String orderId) async {
    await dioClient.dio.post(
      '/payments/cod/confirm',
      data: {'order_id': orderId},
    );
  }

  Future<String> createVnpayPayment(String orderId) async {
    final res = await dioClient.dio.post(
      '/payments/vnpay/create',
      data: {
        'order_id': orderId,
        'returnUrl':
            '', // mobile bạn có thể dùng deep-link sau, tạm để BE ignore
      },
    );
    return res.data['data']['payment_url'] as String;
  }

  /// check coupon giống web: GET /coupons/{code}/check?subtotal=xxx
  Future<AppliedCoupon> checkCoupon({
    required String code,
    required int subtotal,
  }) async {
    final res = await dioClient.dio.get(
      '/coupons/${Uri.encodeComponent(code)}/check',
      queryParameters: {'subtotal': subtotal},
    );
    return AppliedCoupon.fromJson(res.data['data']);
  }
}
