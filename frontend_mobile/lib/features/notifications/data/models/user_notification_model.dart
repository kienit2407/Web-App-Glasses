// lib/features/notifications/data/models/user_notification_model.dart
class UserNotificationMeta {
  final String? orderId;
  final String? orderNumber;

  const UserNotificationMeta({
    this.orderId,
    this.orderNumber,
  });

  factory UserNotificationMeta.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserNotificationMeta();
    return UserNotificationMeta(
      orderId: json['order_id'] as String?,
      orderNumber: json['order_number'] as String?,
    );
  }
}

class UserNotification {
  final String id;
  final String title;
  final String message;
  final String? thumbnailUrl;
  final DateTime createdAt;
  final bool isRead;
  final UserNotificationMeta meta;

  const UserNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.thumbnailUrl,
    required this.createdAt,
    required this.isRead,
    required this.meta,
  });

  factory UserNotification.fromJson(Map<String, dynamic> json) {
    return UserNotification(
      id: json['_id'] as String,
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      thumbnailUrl: json['thumbnail_url'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      isRead: json['is_read'] as bool? ?? false,
      meta: UserNotificationMeta.fromJson(json['meta'] as Map<String, dynamic>?),
    );
  }

  UserNotification copyWith({
    bool? isRead,
  }) {
    return UserNotification(
      id: id,
      title: title,
      message: message,
      thumbnailUrl: thumbnailUrl,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      meta: meta,
    );
  }
}
