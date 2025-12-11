// lib/features/checkout/presentation/viewmodel/checkout_controller.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/address/data/repository/address_repository.dart';

import 'package:frontend_mobile/features/checkout/data/repository/checkout_repository.dart';

import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';

class CheckoutController extends StateNotifier<CheckoutState> {
  final CheckoutRepository _checkoutRepo;
  final AddressRepository _addressRepo;

  // data để gửi lên BE
  final List<String>? cartItemIds;
  final Map<String, dynamic>? directItem;

  CheckoutController(
    this._checkoutRepo,
    this._addressRepo, {
    required this.cartItemIds,
    required this.directItem,
  }) : super(const CheckoutState()) {
    _init();
  }

  Future<void> _init() async {
    state = state.copyWith(isInitLoading: true, errorMessage: null);
    try {
      final my = await _addressRepo.getMyAddresses();

      Address? selected;
      if (my.defaultAddressId != null) {
        for (final addr in my.addresses) {
          if (addr.id == my.defaultAddressId) {
            selected = addr;
            break;
          }
        }
      }
      selected ??= my.addresses.isNotEmpty ? my.addresses.first : null;

      if (selected == null) {
        state = state.copyWith(
          isInitLoading: false,
          selectedAddress: null,
          addresses: my.addresses,
        );
        return;
      }

      // set địa chỉ, nhưng CHƯA tắt isInitLoading
      state = state.copyWith(
        selectedAddress: selected,
        addresses: my.addresses,
      );

      // gọi preview
      await loadPreview();

      // xong hết rồi mới tắt init loading
      state = state.copyWith(isInitLoading: false);
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString(), isInitLoading: false);
    }
  }

  Future<void> loadPreview() async {
    final address = state.selectedAddress;
    if (address == null) return;

    state = state.copyWith(isPreviewLoading: true, errorMessage: null);
    try {
      final preview = await _checkoutRepo.previewCheckout(
        addressId: address.id,
        cartItemIds: cartItemIds,
        directItem: directItem,
        couponCode: state.appliedCoupon?.code,
      );

      print(
        '>>> preview loaded: subtotal=${preview.subtotal}, '
        'items=${preview.items.length}',
      );

      state = state.copyWith(preview: preview, isPreviewLoading: false);
    } catch (e, s) {
      print('>>> loadPreview error: $e');
      print(s);
      state = state.copyWith(
        isPreviewLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void changeAddress(Address newAddress) {
    state = state.copyWith(selectedAddress: newAddress);
    // mỗi lần đổi địa chỉ -> preview lại
    loadPreview();
  }

  void changePaymentMethod(PaymentMethodMobile method) {
    state = state.copyWith(paymentMethod: method);
  }

  void changeNote(String note) {
    state = state.copyWith(note: note);
  }

  void changeCouponInput(String value) {
    state = state.copyWith(couponInput: value);
  }

  Future<void> applyCoupon() async {
    final preview = state.preview;
    if (preview == null) return;
    final code = state.couponInput.trim().toUpperCase();
    if (code.isEmpty) {
      state = state.copyWith(couponError: 'Vui lòng nhập mã giảm giá');
      return;
    }
    try {
      final coupon = await _checkoutRepo.checkCoupon(
        code: code,
        subtotal: preview.subtotal,
      );
      state = state.copyWith(appliedCoupon: coupon, couponError: null);
      await loadPreview(); // preview lại với coupon mới
    } catch (e) {
      state = state.copyWith(
        appliedCoupon: null,
        couponError: 'Mã giảm giá không hợp lệ hoặc không áp dụng cho đơn này',
      );
    }
  }

  void clearCoupon() {
    state = state.copyWith(
      appliedCoupon: null,
      couponInput: '',
      couponError: null,
    );
    loadPreview();
  }

  /// return: orderId, paymentUrl (nếu vnpay)
  Future<Map<String, String?>> placeOrder() async {
    final preview = state.preview;
    final addr = state.selectedAddress;
    if (preview == null || addr == null) {
      throw Exception('Thiếu thông tin checkout');
    }

    state = state.copyWith(isPlacingOrder: true, errorMessage: null);
    try {
      final data = await _checkoutRepo.createOrder(
        addressId: addr.id,
        cartItemIds: cartItemIds,
        directItem: directItem,
        couponCode: state.appliedCoupon?.code,
        note: state.note.isEmpty ? null : state.note,
        paymentMethod: state.paymentMethod, 
      );
      final order = data['order'] as Map<String, dynamic>?;
      final orderId = order?['_id'] as String?;

      if (orderId == null) {
        throw Exception('Không lấy được thông tin đơn hàng');
      }

      if (state.paymentMethod == PaymentMethodMobile.cod) {
        await _checkoutRepo.confirmCOD(orderId);
        state = state.copyWith(isPlacingOrder: false);
        return {'orderId': orderId, 'paymentUrl': null};
      } else {
        final url = await _checkoutRepo.createVnpayPayment(orderId);
        state = state.copyWith(isPlacingOrder: false);
        return {'orderId': orderId, 'paymentUrl': url};
      }
    } catch (e) {
      print('[CheckoutController] placeOrder error: $e');
      state = state.copyWith(isPlacingOrder: false, errorMessage: e.toString());
      return {};
    }
  }
}
