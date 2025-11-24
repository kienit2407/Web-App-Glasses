import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';

class SearchResultState {
  final bool isLoading;
  final int page;
  final int limit;
  final int total;

  final String query;
  final String? gender; // male / female / unisex / kids
  final String? shape;  // square / round ...
  final String? type;   // frame / sunglasses
  final String sort;    // newest, price_asc, price_desc

  final List<ProductListItem> items;
  final String? error;

  const SearchResultState({
    this.isLoading = false,
    this.page = 1,
    this.limit = 20,
    this.total = 0,
    this.query = '',
    this.gender,
    this.shape,
    this.type,
    this.sort = 'newest',
    this.items = const [],
    this.error,
  });

  SearchResultState copyWith({
    bool? isLoading,
    int? page,
    int? limit,
    int? total,
    String? query,
    String? gender,
    String? shape,
    String? type,
    String? sort,
    List<ProductListItem>? items,
    String? error,
  }) {
    return SearchResultState(
      isLoading: isLoading ?? this.isLoading,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      query: query ?? this.query,
      gender: gender ?? this.gender,
      shape: shape ?? this.shape,
      type: type ?? this.type,
      sort: sort ?? this.sort,
      items: items ?? this.items,
      error: error,
    );
  }
}
