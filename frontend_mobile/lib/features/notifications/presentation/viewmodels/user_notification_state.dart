import 'package:frontend_mobile/features/notifications/data/models/user_notification_model.dart';

class UserNotificationState {
  final bool isLoading;
  final String? errorMessage;

  final List<UserNotification> items;
  final int page;
  final int total;
  final int pageSize;

  final int unreadCount;

  const UserNotificationState({
    required this.isLoading,
    required this.errorMessage,
    required this.items,
    required this.page,
    required this.total,
    required this.pageSize,
    required this.unreadCount,
  });

  factory UserNotificationState.initial() => const UserNotificationState(
        isLoading: false,
        errorMessage: null,
        items: [],
        page: 1,
        total: 0,
        pageSize: 20,
        unreadCount: 0,
      );

  UserNotificationState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<UserNotification>? items,
    int? page,
    int? total,
    int? pageSize,
    int? unreadCount,
    bool clearError = false,
  }) {
    return UserNotificationState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      items: items ?? this.items,
      page: page ?? this.page,
      total: total ?? this.total,
      pageSize: pageSize ?? this.pageSize,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}
