import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:frontend_mobile/features/cart/data/models/cart_models.dart';
import 'package:frontend_mobile/features/cart/data/repository/cart_repository.dart';
import 'cart_state.dart';

class CartController extends StateNotifier<CartState> {
  CartController(this._repo) : super(const CartState());

  final CartRepository _repo;

  Future<void> loadCart() async {
    state = state.copyWith(isLoading: true);
    try {
      final cart = await _repo.fetchCart();
      // nếu chưa chọn gì -> chọn hết
      final ids = cart.items.map((e) => e.itemId).toList();
      state = state.copyWith(
        cart: cart,
        isLoading: false,
        selectedItemIds: ids,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> addToCart(String variantId, int qty) async {
    state = state.copyWith(isUpdating: true);
    try {
      final cart = await _repo.addItem(variantId: variantId, quantity: qty);
      final lastItem = cart.items.isNotEmpty ? cart.items.last : null;
      final selected = [...state.selectedItemIds];
      if (lastItem != null && !selected.contains(lastItem.itemId)) {
        selected.add(lastItem.itemId);
      }
      state = state.copyWith(
        cart: cart,
        isUpdating: false,
        selectedItemIds: selected,
      );
    } catch (e) {
      state = state.copyWith(isUpdating: false);
      rethrow;
    }
  }

  Future<void> updateItemQuantity(String itemId, int quantity) async {
    state = state.copyWith(isUpdating: true);
    try {
      final cart = await _repo.updateItemQuantity(
        itemId: itemId,
        quantity: quantity,
      );
      state = state.copyWith(cart: cart, isUpdating: false);
    } catch (e) {
      state = state.copyWith(isUpdating: false);
    }
  }

  Future<void> removeItem(String itemId) async {
    state = state.copyWith(isUpdating: true);
    try {
      final cart = await _repo.removeItem(itemId: itemId);
      final selected = state.selectedItemIds
          .where((id) => id != itemId)
          .toList();
      state = state.copyWith(
        cart: cart,
        isUpdating: false,
        selectedItemIds: selected,
      );
    } catch (e) {
      state = state.copyWith(isUpdating: false);
    }
  }

  void toggleSelectItem(String itemId) {
    final selected = [...state.selectedItemIds];
    if (selected.contains(itemId)) {
      selected.remove(itemId);
    } else {
      selected.add(itemId);
    }
    state = state.copyWith(selectedItemIds: selected);
  }

  void toggleSelectAll() {
    final cart = state.cart;
    if (cart == null) return;
    if (state.selectedItemIds.length == cart.items.length) {
      state = state.copyWith(selectedItemIds: []);
    } else {
      state = state.copyWith(
        selectedItemIds: cart.items.map((e) => e.itemId).toList(),
      );
    }
  }
}
