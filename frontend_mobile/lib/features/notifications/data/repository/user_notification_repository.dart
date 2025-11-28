// lib/features/notifications/data/repositories/user_notification_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/notifications/data/models/user_notification_model.dart';

class NotificationPageResult {
  final List<UserNotification> items;
  final int total;

  NotificationPageResult({
    required this.items,
    required this.total,
  });
}

class UserNotificationRepository {
  final DioClient dioClient;

  UserNotificationRepository({required this.dioClient});

  Future<NotificationPageResult> getNotifications({
    required int page,
    required int limit,
  }) async {
    final res = await dioClient.dio.get(
      '/notifications',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );

    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    final rawItems = (data['items'] as List<dynamic>? ?? []);

    // Nếu chỉ muốn thông báo đơn hàng thì filter ở đây:
    final items = rawItems
        .map((e) => UserNotification.fromJson(e as Map<String, dynamic>))
        .where((n) => n.meta.orderId != null) // 👈 chỉ đơn hàng
        .toList();

    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
    final total = pagination['total'] as int? ?? items.length;

    return NotificationPageResult(items: items, total: total);
  }

  Future<void> markRead(String id) async {
    await dioClient.dio.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await dioClient.dio.patch('/notifications/read-all');
  }

  Future<void> deleteOne(String id) async {
    await dioClient.dio.delete('/notifications/$id');
  }

  Future<void> deleteAll() async {
    await dioClient.dio.delete('/notifications');
  }
}
