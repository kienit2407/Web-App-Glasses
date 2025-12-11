// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:frontend_mobile/features/cart/data/models/cart_models.dart';

class CartState {
  final CartModel? cart;
  final bool isLoading;
  final bool isUpdating;
  final String? errorMessage;
  final List<String> selectedItemIds;

  const CartState({
    this.cart,
    this.isLoading = false,
    this.isUpdating = false,
    this.errorMessage,
    this.selectedItemIds = const [],
  });

  CartState copyWith({
    CartModel? cart,
    bool? isLoading,
    bool? isUpdating,
    String? errorMessage,
    List<String>? selectedItemIds,
  }) {
    return CartState(
      cart: cart ?? this.cart,
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      errorMessage: errorMessage ?? this.errorMessage,
      selectedItemIds: selectedItemIds ?? this.selectedItemIds,
    );
  }
}
