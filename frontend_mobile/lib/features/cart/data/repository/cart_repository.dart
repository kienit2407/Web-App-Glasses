import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/cart/data/models/cart_models.dart';

class CartRepository {
  final Dio _dio;
  CartRepository({required DioClient dioClient}) : _dio = dioClient.dio;

  Future<CartModel> fetchCart() async {
    final res = await _dio.get('/cart');
    final data = res.data['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> addItem({
    required String variantId,
    int quantity = 1,
  }) async {
    final res = await _dio.post(
      '/cart/add-item',
      data: {'variant_id': variantId, 'quantity': quantity},
    );
    final data = res.data['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> updateItemQuantity({
    required String itemId,
    required int quantity,
  }) async {
    final res = await _dio.patch(
      '/cart/update/$itemId',
      data: {'quantity': quantity},
    );
    final data = res.data['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> removeItem({required String itemId}) async {
    final res = await _dio.delete('/cart/remove/$itemId');
    final data = res.data['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }
}
