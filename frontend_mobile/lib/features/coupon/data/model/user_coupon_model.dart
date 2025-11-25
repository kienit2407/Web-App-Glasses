// lib/features/coupon/data/model/user_coupon_model.dart
class UserCoupon {
  final String id;
  final String code;
  final String type; // "percent" | "fixed"
  final int value;
  final int? maxDiscount;
  final int? minOrder;
  final bool canUse;
  final bool isExpired;
  final bool isUsed;
  final int? missingAmount;
  final DateTime? startDate;
  final DateTime? endDate;

  UserCoupon({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minOrder,
    this.canUse = false,
    this.isExpired = false,
    this.isUsed = false,
    this.missingAmount,
    this.startDate,
    this.endDate,
  });

  factory UserCoupon.fromJson(Map<String, dynamic> json) {
    return UserCoupon(
      id: json['_id'] as String,
      code: json['code'] as String,
      type: json['type'] as String,
      value: (json['value'] as num).toInt(),
      maxDiscount: (json['max_discount'] as num?)?.toInt(),
      minOrder: (json['min_order'] as num?)?.toInt(),
      canUse: json['can_use'] as bool? ?? false,
      isExpired: json['is_expired'] as bool? ?? false,
      isUsed: json['is_used'] as bool? ?? false,
      missingAmount: (json['missing_amount'] as num?)?.toInt(),
      startDate: json['start_date'] != null
          ? DateTime.tryParse(json['start_date'] as String)
          : null,
      endDate: json['end_date'] != null
          ? DateTime.tryParse(json['end_date'] as String)
          : null,
    );
  }
}
