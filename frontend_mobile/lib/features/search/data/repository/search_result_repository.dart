import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';

class SearchResultRepository {
  final DioClient dioClient;
  SearchResultRepository(this.dioClient);

  Future<SearchResultResponse> searchProducts({
    String? q,
    List<String>? categories,
    String? brandId,           // 👈 dùng 1 brandId
    String? gender,
    String? shape,
    String? type,              // frame | sunglasses
    int page = 1,
    int limit = 20,
    String sort = 'newest',
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sort': sort,
    };

    if (q != null && q.isNotEmpty) {
      params['q'] = q;
    }
    if (categories != null && categories.isNotEmpty) {
      params['categories'] = categories.join(',');
    }
    if (brandId != null && brandId.isNotEmpty) {
      params['brands'] = brandId;          // 👈 gửi đúng brands=brandId
    }
    if (gender != null) {
      params['gender'] = gender;
    }
    if (shape != null) {
      params['shape'] = shape;
    }
    if (type != null) {
      params['type'] = type;
    }

    final res = await dioClient.dio.get(
      '/catalog/products',
      queryParameters: params,
    );

    final data = res.data['data'] as List<dynamic>? ?? [];
    final pagination = res.data['pagination'] ?? {};

    final items = data
        .map((e) => ProductListItem.fromJson(e as Map<String, dynamic>))
        .toList();

    return SearchResultResponse(
      items: items,
      total: pagination['total'] ?? 0,
      page: pagination['page'] ?? page,
      limit: pagination['limit'] ?? limit,
    );
  }
}

class SearchResultResponse {
  final List<ProductListItem> items;
  final int total;
  final int page;
  final int limit;
  SearchResultResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });
}
