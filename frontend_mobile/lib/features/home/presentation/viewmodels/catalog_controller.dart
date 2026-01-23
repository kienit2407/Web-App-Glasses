import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/home/data/repository/catalog_repository.dart';

import 'catalog_state.dart';

class CatalogController extends StateNotifier<CatalogState> {
  // FIX FLICKER: Khởi tạo với isLoading = true để hiển thị Skeleton ngay lập tức
  CatalogController(this._repo) : super(const CatalogState(isLoading: true)) {
    // Tự động load dữ liệu ngay khi controller được tạo
    loadInitial();
  }

  final CatalogRepository _repo;

  Future<void> loadInitial() async {
    // Lưu ý: Không check state.isLoading ở đây nữa vì mặc định đã là true
    // Nếu muốn check double-call thì cần biến riêng, nhưng gọi trong constructor thì an toàn.

    // Đảm bảo state đang là loading (phòng trường hợp gọi từ nơi khác)
    if (!state.isLoading) {
      state = state.copyWith(isLoading: true);
    }

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
    // Khi refresh, reset state về loading=true để hiện skeleton nếu muốn, hoặc giữ list cũ
    // Ở đây ta reset về CatalogState(isLoading: true) để hiện skeleton lại cho giống app xịn
    state = const CatalogState(limit: 12, isLoading: true);
    debugPrint('[CatalogController] refresh called');
    await loadInitial();
  }
}
