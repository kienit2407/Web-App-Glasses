// lib/features/coupon_center/presentation/viewmodels/coupon_center_controller.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/coupon_center/data/models/coupon_center_models.dart';
import 'package:frontend_mobile/features/coupon_center/data/repository/coupon_center_repository.dart';
import 'package:frontend_mobile/features/coupon_center/presentation/viewmodel/coupon_center_state.dart';

class CouponCenterController extends StateNotifier<CouponCenterState> {
  final CouponCenterRepository _repo;

  CouponCenterController(this._repo) : super(CouponCenterState.initial()) {
    // loadCouponsAndPromotions();
    // loadHighlight();
  }

  // Load coupon và promotions khi cần
  Future<void> loadCouponsAndPromotions() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final coupons = await _repo.getCoupons();
      final promotions = await _repo.getPromotions();
      state = state.copyWith(
        isLoading: false,
        coupons: coupons,
        promotions: promotions,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      print('Error loading coupons and promotions: $e');
    }
  }

  // Load highlight chỉ khi cần (ví dụ: khi có yêu cầu từ phía UI)
  Future<void> loadHighlight() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final highlight = await _repo.getHighlight();
      state = state.copyWith(isLoading: false, highlight: highlight);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      print('Error loading highlight: $e');
    }
  }

  Future<void> saveCoupon(CouponCenterItem coupon) async {
    if (coupon.isSaved) return;
    state = state.copyWith(savingCouponId: coupon.id, clearError: true);
    try {
      await _repo.saveCoupon(coupon.code);
      final updated = state.coupons
          .map((c) => c.id == coupon.id ? c.copyWith(isSaved: true) : c)
          .toList();
      state = state.copyWith(coupons: updated, clearSavingId: true);
    } catch (e) {
      // log cho dev

      print('[CouponCenterController] saveCoupon error: $e');

      // cập nhật state cho UI
      state = state.copyWith(clearSavingId: true, errorMessage: e.toString());
    }
  }

  Future<void> dismissHighlight() async {
    final promo = state.highlight;
    if (promo == null) {
      state = state.copyWith(highlight: null);
      return;
    }

    state = state.copyWith(isMarkingHighlight: true, clearError: true);
    try {
      await _repo.markHighlightSeen(promo.id);
    } catch (_) {
      // ignore error, vẫn tắt popup
    } finally {
      state = state.copyWith(isMarkingHighlight: false, highlight: null);
    }
  }
}
