// lib/features/coupon_center/presentation/viewmodels/coupon_center_state.dart
import 'package:frontend_mobile/features/coupon_center/data/models/coupon_center_models.dart';

class CouponCenterState {
  final bool isLoading;
  final String? errorMessage;
  final String? savingCouponId;
  final bool isMarkingHighlight;

  final List<CouponCenterItem> coupons;
  final List<PromotionCenterItem> promotions;
  final HighlightPromotion? highlight;

  const CouponCenterState({
    required this.isLoading,
    required this.errorMessage,
    required this.savingCouponId,
    required this.isMarkingHighlight,
    required this.coupons,
    required this.promotions,
    required this.highlight,
  });

  factory CouponCenterState.initial() => const CouponCenterState(
        isLoading: false,
        errorMessage: null,
        savingCouponId: null,
        isMarkingHighlight: false,
        coupons: [],
        promotions: [],
        highlight: null,
      );

  CouponCenterState copyWith({
    bool? isLoading,
    String? errorMessage,
    String? savingCouponId,
    bool? isMarkingHighlight,
    List<CouponCenterItem>? coupons,
    List<PromotionCenterItem>? promotions,
    HighlightPromotion? highlight,
    bool clearError = false,
    bool clearSavingId = false,
  }) {
    return CouponCenterState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      savingCouponId: clearSavingId ? null : (savingCouponId ?? this.savingCouponId),
      isMarkingHighlight: isMarkingHighlight ?? this.isMarkingHighlight,
      coupons: coupons ?? this.coupons,
      promotions: promotions ?? this.promotions,
      highlight: highlight ?? this.highlight,
    );
  }
}
