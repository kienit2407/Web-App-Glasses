import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/order/data/models/order_model.dart';

class OrderRepository {
  final DioClient dioClient;

  OrderRepository(this.dioClient);

  Future<OrderListResponse> listMy({
    required String status,
    required int page,
    int limit = 10,
  }) async {
    final queryParams = status == 'all'
        ? {
            'page': page,
            'limit': limit,
          }
        : {
            'status': status,
            'page': page,
            'limit': limit,
          };

    final res = await dioClient.dio.get(
      '/orders',
      queryParameters: queryParams,
    );

    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    final itemsJson = data['items'] as List<dynamic>? ?? [];
    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};

    final items = itemsJson
        .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final total = (pagination['total'] as num?)?.toInt() ?? items.length;
    final pageRes = (pagination['page'] as num?)?.toInt() ?? page;
    final limitRes = (pagination['limit'] as num?)?.toInt() ?? limit;

    return OrderListResponse(
      items: items,
      page: pageRes,
      limit: limitRes,
      total: total,
    );
  }
  Future<Map<String, dynamic>> fetchOrderDetail(String id) async {
    final res = await dioClient.dio.get('/orders/$id');
    final body = res.data as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    return data;
  }
  Future<Map<String, int>> getStats() async {
    final res = await dioClient.dio.get('/orders/stats');
    final data = res.data['data'] as Map<String, dynamic>? ?? {};

    return data.map(
      (key, value) => MapEntry(key, (value as num?)?.toInt() ?? 0),
    );
  }

  Future<void> requestCancel(String orderId) async {
    await dioClient.dio.patch('/orders/$orderId/cancel');
  }

  Future<void> confirmDelivered(String orderId) async {
    await dioClient.dio.patch('/orders/$orderId/confirm-delivered');
  }

  Future<void> requestReturn(String orderId) async {
    await dioClient.dio.patch('/orders/$orderId/request-return');
  }

  Future<void> reorder(String orderId) async {
    await dioClient.dio.post('/orders/$orderId/reorder');
  }
}
