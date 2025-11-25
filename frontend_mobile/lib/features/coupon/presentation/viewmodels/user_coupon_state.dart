import 'package:frontend_mobile/features/coupon/data/model/user_coupon_model.dart';

class UserCouponState {
  final bool isLoading;
  final String? errorMessage;
  final List<UserCoupon> coupons;

  const UserCouponState({
    required this.isLoading,
    required this.errorMessage,
    required this.coupons,
  });

  factory UserCouponState.initial() =>
      const UserCouponState(isLoading: false, errorMessage: null, coupons: []);

  UserCouponState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<UserCoupon>? coupons,
  }) {
    return UserCouponState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      coupons: coupons ?? this.coupons,
    );
  }
}
