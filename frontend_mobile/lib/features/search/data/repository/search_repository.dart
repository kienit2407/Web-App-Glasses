// lib/features/search/data/repository/search_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart'; // để dùng DioClient

class SearchSuggestResult {
  final List<String> keywords;
  final List<SearchProductSuggestion> products;
  final List<SearchBrandSuggestion> brands;

  SearchSuggestResult({
    required this.keywords,
    required this.products,
    required this.brands,
  });
}

class SearchProductSuggestion {
  final String id;
  final String name;
  SearchProductSuggestion({required this.id, required this.name});
}

class SearchBrandSuggestion {
  final String id;
  final String name;
  final String? logoUrl;
  SearchBrandSuggestion({required this.id, required this.name, this.logoUrl});
}

class SearchRepository {
  final DioClient dioClient; // <-- dùng DioClient, không dùng Dio trực tiếp
  SearchRepository({required this.dioClient});

  Future<SearchSuggestResult> fetch(String keyword) async {
    if (keyword.trim().isEmpty) {
      return SearchSuggestResult(keywords: [], products: [], brands: []);
    }

    final res = await dioClient.dio.get(
      '/catalog/products/search-suggest',
      queryParameters: {'q': keyword, 'limit': 10},
    );

    final data = res.data['data'] ?? {};
    final List kw = data['keywords'] ?? [];
    final List ps = data['products'] ?? [];
    final List bs = data['brands'] ?? [];

    return SearchSuggestResult(
      keywords: kw.cast<String>(),
      products: ps
          .map(
            (e) => SearchProductSuggestion(
              id: e['product_id'] as String,
              name: e['product_name'] as String,
            ),
          )
          .toList(),
      brands: bs
          .map(
            (e) => SearchBrandSuggestion(
              id: e['brand_id'] as String,
              name: e['brand_name'] as String,
              logoUrl: e['logo_url'] as String?,
            ),
          )
          .toList(),
    );
  }

  Future<List<String>> fetchSuggestions(String keyword) async {
    final result = await fetch(keyword);
    return result.keywords; // chỉ lấy list keyword để hiển thị
  }
}
