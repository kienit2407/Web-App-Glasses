import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/home/data/repository/catalog_repository.dart';

import 'catalog_state.dart';

class CatalogController extends StateNotifier<CatalogState> {
  CatalogController(this._repo) : super(const CatalogState());

  final CatalogRepository _repo;

  Future<void> loadInitial() async {
    // tránh gọi lại nhiều lần
    if (state.isLoading || state.products.isNotEmpty) return;

    state = state.copyWith(isLoading: true);
    try {
      final banners = await _repo.fetchBanners();
      final brands = await _repo.fetchBrands();
      final pageData = await _repo.fetchProducts(
        page: 1,
        limit: state.limit,
        q: state.searchQuery,
      );

      state = state.copyWith(
        isLoading: false,
        banners: banners,
        brands: brands,
        products: pageData.items,
        page: pageData.page,
        limit: pageData.limit,
        total: pageData.total,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = state.page + 1;
      final pageData = await _repo.fetchProducts(
        page: nextPage,
        limit: state.limit,
        q: state.searchQuery,
      );

      state = state.copyWith(
        isLoadingMore: false,
        products: [...state.products, ...pageData.items],
        page: pageData.page,
        limit: pageData.limit,
        total: pageData.total,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setSearchQuery(String q) {
    state = state.copyWith(searchQuery: q);
  }

  Future<void> refresh() async {
    state = const CatalogState(limit: 12); // reset
    debugPrint('[CatalogController] refresh called');
    await loadInitial();
  }
}
