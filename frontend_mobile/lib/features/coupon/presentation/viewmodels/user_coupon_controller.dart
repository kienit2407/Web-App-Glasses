// lib/features/coupon/presentation/viewmodels/user_coupon_controller.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/coupon/data/model/user_coupon_model.dart';
import 'package:frontend_mobile/features/coupon/data/repository/coupon_repository.dart';
import 'package:frontend_mobile/features/coupon/presentation/viewmodels/user_coupon_state.dart';

class UserCouponController extends StateNotifier<UserCouponState> {
  final CouponRepository repo;
  final int subtotal;

  UserCouponController(this.repo, {required this.subtotal})
      : super(UserCouponState.initial()) {
    load(); // load ngay lần đầu giống useCouponStore.fetchMyCoupons
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final List<UserCoupon> list = await repo.getMyCoupons(subtotal: subtotal);
      // DEBUG: In ra để biết đã lấy được bao nhiêu
      print("CONTROLLER: Đã load được ${list.length} coupon"); 
      state = state.copyWith(isLoading: false, coupons: list);
    } catch (e, stacktrace) {
      // DEBUG: In lỗi chi tiết ra console để xem có phải do parse model bị sai không
      print("CONTROLLER ERROR: $e");
      print(stacktrace); 
      
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Không tải được voucher: $e',
      );
    }
  }

  // nếu sau này cần refetch bằng action
  Future<void> refresh() => load();
}
