class CartItemModel {
  final String itemId;
  final String cartId;
  final String variantId;
  final String productId;
  final String productName;
  final String? thumbnailUrl;
  final String? frameColor;
  final String? frameShape;

  final int originalUnitPrice;
  final int unitPrice;
  final bool hasDiscount;
  final int discountPercent;
  final int quantity;

  final int originalSubtotal;
  final int subtotal;
  final int discountAmount;

  CartItemModel({
    required this.itemId,
    required this.cartId,
    required this.variantId,
    required this.productId,
    required this.productName,
    required this.thumbnailUrl,
    required this.frameColor,
    required this.frameShape,
    required this.originalUnitPrice,
    required this.unitPrice,
    required this.hasDiscount,
    required this.discountPercent,
    required this.quantity,
    required this.originalSubtotal,
    required this.subtotal,
    required this.discountAmount,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      itemId: json['item_id'] as String? ?? '',
      cartId: json['cart_id'] as String? ?? '',
      variantId: json['variant_id'] as String? ?? '',
      productId: json['product_id'] as String? ?? '',
      productName: json['product_name'] as String? ?? '',
      thumbnailUrl: json['thumbnail_url'] as String?,
      frameColor: json['frame_color'] as String?,
      frameShape: json['frame_shape'] as String?,
      originalUnitPrice: (json['original_unit_price'] as num?)?.toInt() ?? 0,
      unitPrice: (json['unit_price'] as num?)?.toInt() ?? 0,
      hasDiscount: json['has_discount'] as bool? ?? false,
      discountPercent: (json['discount_percent'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      originalSubtotal: (json['original_subtotal'] as num?)?.toInt() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      discountAmount: (json['discount_amount'] as num?)?.toInt() ?? 0,
    );
  }
}

class CartModel {
  final String cartId;
  final List<CartItemModel> items;
  final int totalQuantity;
  final int totalOriginalAmount;
  final int totalAmount;
  final int totalDiscountAmount;

  CartModel({
    required this.cartId,
    required this.items,
    required this.totalQuantity,
    required this.totalOriginalAmount,
    required this.totalAmount,
    required this.totalDiscountAmount,
  });

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final listJson = (json['items'] as List?) ?? [];
    return CartModel(
      cartId: json['cart_id'] as String? ?? '',
      items: listJson
          .map((e) => CartItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalQuantity: (json['total_quantity'] as num?)?.toInt() ?? 0,
      totalOriginalAmount:
          (json['total_original_amount'] as num?)?.toInt() ?? 0,
      totalAmount: (json['total_amount'] as num?)?.toInt() ?? 0,
      totalDiscountAmount:
          (json['total_discount_amount'] as num?)?.toInt() ?? 0,
    );
  }
}
