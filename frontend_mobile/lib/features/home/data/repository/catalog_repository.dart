import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';

import '../models/product_list_item.dart';
import '../models/brand_model.dart';
import '../models/banner_model.dart';

class PagedProducts {
  final List<ProductListItem> items;
  final int page;
  final int limit;
  final int total;

  PagedProducts({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
  });
}

class CatalogRepository {
  final Dio _dio;

  CatalogRepository({required DioClient dioClient}) : _dio = dioClient.dio;

  Future<PagedProducts> fetchProducts({
    int page = 1,
    int limit = 12,
    String? q,
  }) async {
    final res = await _dio.get(
      '/catalog/products',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (q != null && q.isNotEmpty) 'q': q,
      },
    );

    final data = res.data as Map<String, dynamic>;
    final listJson = (data['data'] as List?) ?? [];
    final pagination = (data['pagination'] as Map<String, dynamic>? ?? {});

    final items = listJson
        .map((e) => ProductListItem.fromJson(e as Map<String, dynamic>))
        .toList();

    return PagedProducts(
      items: items,
      page: (pagination['page'] as num?)?.toInt() ?? page,
      limit: (pagination['limit'] as num?)?.toInt() ?? limit,
      total: (pagination['total'] as num?)?.toInt() ?? items.length,
    );
  }

  Future<List<BrandModel>> fetchBrands() async {
    final res = await _dio.get(
      '/catalog/brands',
      queryParameters: {'active': 1},
    );

    final listJson = (res.data['data'] as List?) ?? [];
    return listJson
        .map((e) => BrandModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<BannerModel>> fetchBanners() async {
    final res = await _dio.get('/shop-settings');

    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    final listJson = (data['banner_list'] as List?) ?? [];

    final list = listJson
        .map((e) => BannerModel.fromJson(e as Map<String, dynamic>))
        .toList();

    list.sort((a, b) => a.position.compareTo(b.position));
    return list;
  }
}
