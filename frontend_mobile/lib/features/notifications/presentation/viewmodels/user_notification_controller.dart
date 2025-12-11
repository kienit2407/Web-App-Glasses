// lib/features/notifications/presentation/viewmodels/user_notification_controller.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/notifications/data/models/user_notification_model.dart';
import 'package:frontend_mobile/features/notifications/data/repository/user_notification_repository.dart';
import 'package:frontend_mobile/features/notifications/presentation/viewmodels/user_notification_state.dart';

class UserNotificationController extends StateNotifier<UserNotificationState> {
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
      final res = await _repo.getNotifications(
        page: page,
        limit: state.pageSize,
      );

      state = state.copyWith(
        isLoading: false,
        items: res.items,
        page: page,
        total: res.total,
        unreadCount: res.unreadCount, // lấy từ BE
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> refresh() => loadPage(1);

  Future<void> markRead(UserNotification item) async {
    if (item.isRead) return;

    // optional: cập nhật local cho mượt
    final updated = state.items
        .map((n) => n.id == item.id ? n.copyWith(isRead: true) : n)
        .toList();
    state = state.copyWith(
      items: updated,
      // tạm giảm 1, tí nữa refresh lại vẫn chuẩn theo BE
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
    );

    try {
      await _repo.markRead(item.id);
      await refresh(); // 👈 sync chuẩn với BE
    } catch (_) {
      await refresh(); // lỗi thì cũng sync lại
    }
  }

  Future<void> markAllRead() async {
    // update local cho thấy UI phản hồi ngay
    final updated = state.items.map((n) => n.copyWith(isRead: true)).toList();
    state = state.copyWith(items: updated, unreadCount: 0);

    try {
      await _repo.markAllRead();
      await refresh(); //  sync lại theo BE
    } catch (_) {
      await refresh();
    }
  }

  Future<void> deleteOne(UserNotification item) async {
    final updated = state.items.where((n) => n.id != item.id).toList();
    final newUnread = item.isRead
        ? state.unreadCount
        : (state.unreadCount > 0 ? state.unreadCount - 1 : 0);

    state = state.copyWith(
      items: updated,
      total: state.total > 0 ? state.total - 1 : 0,
      unreadCount: newUnread,
    );

    try {
      await _repo.deleteOne(item.id);
      await refresh(); //  luôn sync lại
    } catch (_) {
      await refresh();
    }
  }

  Future<void> deleteAll() async {
    // local
    state = state.copyWith(items: [], total: 0, unreadCount: 0);
    try {
      await _repo.deleteAll();
      await refresh(); //  bảo đảm sau khi BE xử lý xong, state khớp 100%
    } catch (_) {
      await refresh();
    }
  }
}
