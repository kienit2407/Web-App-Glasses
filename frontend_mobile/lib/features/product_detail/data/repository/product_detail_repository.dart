import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import '../model/product_detail_model.dart';

class ProductDetailRepository {
  final Dio _dio;

  ProductDetailRepository({required DioClient dioClient})
    : _dio = dioClient.dio;

  Future<ProductDetail> fetchDetail(String productId) async {
    final res = await _dio.get('/catalog/products/$productId');
    final data = res.data['data'] as Map<String, dynamic>;
    return ProductDetail.fromJson(data);
  }
}
