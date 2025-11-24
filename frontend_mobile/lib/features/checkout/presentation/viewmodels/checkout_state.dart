// lib/features/checkout/presentation/viewmodel/checkout_state.dart
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/checkout/model/checkout_models.dart';

enum PaymentMethodMobile { cod, vnpay }

class CheckoutState {
  final bool isInitLoading;
  final bool isPreviewLoading;
  final bool isPlacingOrder;
  final List<Address> addresses;
  final Address? selectedAddress;
  final CheckoutPreview? preview;

  final String couponInput;
  final AppliedCoupon? appliedCoupon;
  final String? couponError;

  final PaymentMethodMobile paymentMethod;
  final String note;

  final String? errorMessage;

  const CheckoutState({
    this.isInitLoading = false,
    this.isPreviewLoading = false,
    this.isPlacingOrder = false,
    this.addresses = const [],
    this.selectedAddress,
    this.preview,
    this.couponInput = '',
    this.appliedCoupon,
    this.couponError,
    this.paymentMethod = PaymentMethodMobile.cod,
    this.note = '',
    this.errorMessage,
  });

  CheckoutState copyWith({
    bool? isInitLoading,
    bool? isPreviewLoading,
    bool? isPlacingOrder,
    List<Address>? addresses,
    Address? selectedAddress,
    CheckoutPreview? preview,
    String? couponInput,
    AppliedCoupon? appliedCoupon,
    String? couponError,
    PaymentMethodMobile? paymentMethod,
    String? note,
    String? errorMessage,
  }) {
    return CheckoutState(
      isInitLoading: isInitLoading ?? this.isInitLoading,
      isPreviewLoading: isPreviewLoading ?? this.isPreviewLoading,
      isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
      selectedAddress: selectedAddress ?? this.selectedAddress,
      preview: preview ?? this.preview,
      couponInput: couponInput ?? this.couponInput,
      addresses: addresses ?? this.addresses,
      appliedCoupon: appliedCoupon ?? this.appliedCoupon,
      couponError: couponError,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      note: note ?? this.note,
      errorMessage: errorMessage,
    );
  }
}
