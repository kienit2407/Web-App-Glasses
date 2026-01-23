import 'package:frontend_mobile/features/home/data/models/banner_model.dart';
import 'package:frontend_mobile/features/home/data/models/brand_model.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';

class CatalogState {
  final bool isLoading;
  final bool isLoadingMore;
  final List<ProductListItem> products;
  final int page;
  final int limit;
  final int total;
  final List<BrandModel> brands;
  final List<BannerModel> banners;
  final String searchQuery;

  bool get hasMore => products.length < total;

  const CatalogState({
    this.isLoading = false,
    this.isLoadingMore = false,
    this.products = const [],
    this.page = 1,
    this.limit = 12,
    this.total = 0,
    this.brands = const [],
    this.banners = const [],
    this.searchQuery = '',
  });

  CatalogState copyWith({
    bool? isLoading,
    bool? isLoadingMore,
    List<ProductListItem>? products,
    int? page,
    int? limit,
    int? total,
    List<BrandModel>? brands,
    List<BannerModel>? banners,
    String? searchQuery,
  }) {
    return CatalogState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      products: products ?? this.products,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      brands: brands ?? this.brands,
      banners: banners ?? this.banners,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}
