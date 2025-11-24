

class CheckoutArgs {
  final List<String>? cartItemIds;
  final Map<String, dynamic>? directItem;

  /// case đi từ giỏ hàng
  CheckoutArgs.fromCart({
    required List<String> cartItemIds,
  })  : cartItemIds = cartItemIds,
        directItem = null;

  /// case "Mua ngay" từ product detail
  CheckoutArgs.direct({
    required String variantId,
    required int quantity,
  })  : cartItemIds = null,
        directItem = {
          'variant_id': variantId,
          'quantity': quantity,
        };
}
