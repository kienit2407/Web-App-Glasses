class OrderItemModel {
  final String productId;
  final String slug;
  final String productName;
  final String thumbnailUrl;
  final String? variantName;
  final int quantity;
  final int price;

  OrderItemModel({
    required this.productId,
    required this.slug,
    required this.productName,
    required this.thumbnailUrl,
    this.variantName,
    required this.quantity,
    required this.price,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      productId: json['product_id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      productName: json['product_name']?.toString() ?? '',
      thumbnailUrl: json['thumbnail_url']?.toString() ?? '',
      variantName: json['variant_name']?.toString(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      price: (json['price'] as num?)?.toInt() ?? 0,
    );
  }
}

class OrderModel {
  final String id;
  final String code;
  final String shopName;
  final String status; // pending / processing / shipping / delivering / delivered / cancelled / returned...
  final bool cancelRequested;
  final bool returnRequested;
  final List<OrderItemModel> items;
  final int totalAmount;
  final DateTime? createdAt;

  OrderModel({
    required this.id,
    required this.code,
    required this.shopName,
    required this.status,
    required this.cancelRequested,
    required this.returnRequested,
    required this.items,
    required this.totalAmount,
    this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final itemsJson = (json['items'] as List<dynamic>?) ?? [];

    return OrderModel(
      id: json['_id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      shopName: json['shop_name']?.toString() ?? 'Shop kính',
      status: json['status']?.toString() ?? '',
      cancelRequested: json['cancel_requested'] as bool? ?? false,
      returnRequested: json['return_requested'] as bool? ?? false,
      items: itemsJson
          .map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalAmount: (json['total_amount'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }
}

class OrderListResponse {
  final List<OrderModel> items;
  final int page;
  final int limit;
  final int total;

  OrderListResponse({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
  });
}
