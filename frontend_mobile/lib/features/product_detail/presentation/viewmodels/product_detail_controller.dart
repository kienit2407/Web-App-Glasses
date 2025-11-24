// lib/features/product_detail/presentation/viewmodels/product_detail_controller.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/product_detail/data/model/product_detail_model.dart';
import 'package:frontend_mobile/features/product_detail/data/repository/product_detail_repository.dart';
import 'package:frontend_mobile/core/di/providers.dart';

class ProductDetailState {
  final bool isLoading;
  final String? error;
  final ProductDetail? detail;
  final String? selectedVariantId;
  final int quantity;

  const ProductDetailState({
    this.isLoading = false,
    this.error,
    this.detail,
    this.selectedVariantId,
    this.quantity = 1,
  });

  ProductDetailState copyWith({
    bool? isLoading,
    String? error,
    ProductDetail? detail,
    String? selectedVariantId,
    int? quantity,
  }) {
    return ProductDetailState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      detail: detail ?? this.detail,
      selectedVariantId: selectedVariantId ?? this.selectedVariantId,
      quantity: quantity ?? this.quantity,
    );
  }
}

class ProductDetailController extends StateNotifier<ProductDetailState> {
  ProductDetailController(this._repo, this.productId)
    : super(const ProductDetailState()) {
    loadDetail();
  }

  final ProductDetailRepository _repo;
  final String productId;

  Future<void> loadDetail() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final detail = await _repo.fetchDetail(productId);
      final firstVariantId = detail.variants.isNotEmpty
          ? detail.variants.first.variantId
          : null;
      state = state.copyWith(
        isLoading: false,
        detail: detail,
        selectedVariantId: firstVariantId,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectVariant(String variantId) {
    state = state.copyWith(selectedVariantId: variantId);
  }

  void increaseQuantity() {
    state = state.copyWith(quantity: state.quantity + 1);
  }

  void decreaseQuantity() {
    if (state.quantity > 1) {
      state = state.copyWith(quantity: state.quantity - 1);
    }
  }
}

// Provider cho repository
final productDetailRepositoryProvider = Provider<ProductDetailRepository>((
  ref,
) {
  final dioClient = ref.read(dioClientProvider);
  return ProductDetailRepository(dioClient: dioClient);
});

// Provider family cho từng productId
final productDetailControllerProvider =
    StateNotifierProvider.family<
      ProductDetailController,
      ProductDetailState,
      String
    >((ref, productId) {
      final repo = ref.read(productDetailRepositoryProvider);
      return ProductDetailController(repo, productId);
    });
