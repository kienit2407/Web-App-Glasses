// lib/features/notifications/presentation/viewmodels/user_notification_controller.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/notifications/data/models/user_notification_model.dart';
import 'package:frontend_mobile/features/notifications/data/repository/user_notification_repository.dart';
import 'package:frontend_mobile/features/notifications/presentation/viewmodels/user_notification_state.dart';

class UserNotificationController
    extends StateNotifier<UserNotificationState> {
  final UserNotificationRepository _repo;

  UserNotificationController(this._repo)
      : super(UserNotificationState.initial()) {
    loadPage(1);
  }

  int _calcUnread(List<UserNotification> items) =>
      items.where((n) => !n.isRead).length;

  Future<void> loadPage(int page) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res =
          await _repo.getNotifications(page: page, limit: state.pageSize);

      final unread = _calcUnread(res.items);

      state = state.copyWith(
        isLoading: false,
        items: res.items,
        page: page,
        total: res.total,
        unreadCount: unread,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> refresh() => loadPage(1);

  Future<void> markRead(UserNotification item) async {
    if (item.isRead) return;
    // update local
    final updated = state.items
        .map((n) => n.id == item.id ? n.copyWith(isRead: true) : n)
        .toList();
    state = state.copyWith(
      items: updated,
      unreadCount: _calcUnread(updated),
    );

    try {
      await _repo.markRead(item.id);
    } catch (_) {
      // nếu fail thì thôi, lần sau load lại
    }
  }

  Future<void> markAllRead() async {
    final updated = state.items.map((n) => n.copyWith(isRead: true)).toList();
    state = state.copyWith(items: updated, unreadCount: 0);

    try {
      await _repo.markAllRead();
    } catch (_) {}
  }

  Future<void> deleteOne(UserNotification item) async {
    final updated = state.items.where((n) => n.id != item.id).toList();
    state = state.copyWith(
      items: updated,
      total: state.total > 0 ? state.total - 1 : 0,
      unreadCount: _calcUnread(updated),
    );

    try {
      await _repo.deleteOne(item.id);
    } catch (_) {}
  }

  Future<void> deleteAll() async {
    state = state.copyWith(
      items: [],
      total: 0,
      unreadCount: 0,
    );
    try {
      await _repo.deleteAll();
    } catch (_) {}
  }
}
