// lib/features/checkout/data/models/checkout_models.dart
import 'package:frontend_mobile/features/address/data/models/address_model.dart';

class OrderItemPreview {
  final String productId;
  final String variantId;
  final String name;
  final int unitPrice;
  final int quantity;
  final int total;
  final Map<String, dynamic>? attributes;

  OrderItemPreview({
    required this.productId,
    required this.variantId,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.total,
    this.attributes,
  });

  factory OrderItemPreview.fromJson(Map<String, dynamic> json) {
    return OrderItemPreview(
      productId: json['product_id'] as String,
      variantId: json['variant_id'] as String,
      name: json['name'] as String,
      unitPrice: (json['unit_price'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
      attributes: json['attributes'] is Map<String, dynamic>
          ? json['attributes'] as Map<String, dynamic>
          : null,
    );
  }
}

class AppliedCoupon {
  final String id;
  final String code;
  final String type; // percent | fixed
  final int value;
  final int? maxDiscount;
  final int? minOrder;

  AppliedCoupon({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minOrder,
  });

  factory AppliedCoupon.fromJson(Map<String, dynamic> json) {
    return AppliedCoupon(
      id: json['_id'] as String,
      code: json['code'] as String,
      type: json['type'] as String,
      value: (json['value'] as num?)?.toInt() ?? 0,
      maxDiscount: (json['max_discount'] as num?)?.toInt(),
      minOrder: (json['min_order'] as num?)?.toInt(),
    );
  }
}

class AppliedPromotion {
  final String id;
  final String title;
  final String discountType; // percent | fixed
  final int discountValue;
  final int? maxDiscount;
  final int? minOrder;

  AppliedPromotion({
    required this.id,
    required this.title,
    required this.discountType,
    required this.discountValue,
    this.maxDiscount,
    this.minOrder,
  });

  factory AppliedPromotion.fromJson(Map<String, dynamic> json) {
    return AppliedPromotion(
      id: json['_id'] as String,
      title: json['title'] as String,
      discountType: json['discount_type'] as String,
      discountValue: (json['discount_value'] as num?)?.toInt() ?? 0,
      maxDiscount: (json['max_discount'] as num?)?.toInt(),
      minOrder: (json['min_order'] as num?)?.toInt(),
    );
  }
}

class CheckoutPreview {
  final Address shippingAddress;
  final List<OrderItemPreview> items;
  final int subtotal;
  final int discountAmount;
  final int shippingFee;
  final int totalAmount;
  final AppliedCoupon? appliedCoupon;
  final AppliedPromotion? appliedPromotion;
  final String discountSource; // none | coupon | promotion

  CheckoutPreview({
    required this.shippingAddress,
    required this.items,
    required this.subtotal,
    required this.discountAmount,
    required this.shippingFee,
    required this.totalAmount,
    required this.discountSource,
    this.appliedCoupon,
    this.appliedPromotion,
  });

  factory CheckoutPreview.fromJson(Map<String, dynamic> json) {
    // hỗ trợ cả 'orderItemsData' và 'items'
    final rawItems = (json['orderItemsData'] ?? json['items']) as List<dynamic>? ?? const [];

    return CheckoutPreview(
      shippingAddress: Address.fromJson(
        json['shipping_address'] as Map<String, dynamic>,
      ),
      items: rawItems
          .map((e) => OrderItemPreview.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      discountAmount: (json['discount_amount'] as num?)?.toInt() ?? 0,
      shippingFee: (json['shipping_fee'] as num?)?.toInt() ?? 0,
      totalAmount: (json['total_amount'] as num?)?.toInt() ?? 0,
      discountSource: json['discount_source'] as String? ?? 'none',
      appliedCoupon: json['applied_coupon'] != null
          ? AppliedCoupon.fromJson(
              json['applied_coupon'] as Map<String, dynamic>,
            )
          : null,
      appliedPromotion: json['applied_promotion'] != null
          ? AppliedPromotion.fromJson(
              json['applied_promotion'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}
