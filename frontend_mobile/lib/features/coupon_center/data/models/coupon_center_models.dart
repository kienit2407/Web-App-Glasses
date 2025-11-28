class CouponCenterItem {
  final String id;
  final String code;

  /// "percent" | "fixed"
  final String type;
  final int value;
  final int? maxDiscount;
  final int? minOrder;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isSaved;
  final bool isUsed;

  CouponCenterItem({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minOrder,
    required this.startDate,
    this.endDate,
    required this.isSaved,
    required this.isUsed,
  });

  factory CouponCenterItem.fromJson(Map<String, dynamic> json) {
    return CouponCenterItem(
      id: json['_id'] as String,
      code: json['code'] as String,
      type: json['type'] as String,
      value: (json['value'] as num).toInt(),
      maxDiscount: json['max_discount'] != null
          ? (json['max_discount'] as num).toInt()
          : null,
      minOrder: json['min_order'] != null
          ? (json['min_order'] as num).toInt()
          : null,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
      isSaved: json['is_saved'] == true,
      isUsed: json['is_used'] == true,
    );
  }

  CouponCenterItem copyWith({bool? isSaved}) {
    return CouponCenterItem(
      id: id,
      code: code,
      type: type,
      value: value,
      maxDiscount: maxDiscount,
      minOrder: minOrder,
      startDate: startDate,
      endDate: endDate,
      isSaved: isSaved ?? this.isSaved,
      isUsed: isUsed,
    );
  }
}

class PromotionCenterItem {
  final String id;
  final String title;
  final String? description;
  final String? bannerUrl;
  final String discountType; // "percent" | "fixed"
  final int discountValue;
  final int? maxDiscount;
  final int? minOrder;
  final DateTime startDate;
  final DateTime? endDate;

  PromotionCenterItem({
    required this.id,
    required this.title,
    this.description,
    this.bannerUrl,
    required this.discountType,
    required this.discountValue,
    this.maxDiscount,
    this.minOrder,
    required this.startDate,
    this.endDate,
  });

  factory PromotionCenterItem.fromJson(Map<String, dynamic> json) {
    return PromotionCenterItem(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      bannerUrl: json['banner_url'] as String?,
      discountType: json['discount_type'] as String,
      discountValue: (json['discount_value'] as num).toInt(),
      maxDiscount: json['max_discount'] != null
          ? (json['max_discount'] as num).toInt()
          : null,
      minOrder: json['min_order'] != null
          ? (json['min_order'] as num).toInt()
          : null,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
    );
  }
}

class HighlightPromotion {
  final String id;
  final String title;
  final String? description;
  final String? bannerUrl;
  final DateTime startDate;
  final DateTime? endDate;

  HighlightPromotion({
    required this.id,
    required this.title,
    this.description,
    this.bannerUrl,
    required this.startDate,
    this.endDate,
  });

  factory HighlightPromotion.fromJson(Map<String, dynamic> json) {
    return HighlightPromotion(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      bannerUrl: json['banner_url'] as String?,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
    );
  }
}
