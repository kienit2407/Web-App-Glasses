import 'package:frontend_mobile/features/cart/data/models/cart_models.dart';

class CartState {
  final CartModel? cart;
  final bool isLoading;
  final bool isUpdating;
  final List<String> selectedItemIds;

  const CartState({
    this.cart,
    this.isLoading = false,
    this.isUpdating = false,
    this.selectedItemIds = const [],
  });

  CartState copyWith({
    CartModel? cart,
    bool? isLoading,
    bool? isUpdating,
    List<String>? selectedItemIds,
  }) {
    return CartState(
      cart: cart ?? this.cart,
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      selectedItemIds: selectedItemIds ?? this.selectedItemIds,
    );
  }
}
