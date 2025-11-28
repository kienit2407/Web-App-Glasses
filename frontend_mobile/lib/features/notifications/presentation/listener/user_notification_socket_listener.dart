// lib/features/notifications/presentation/listener/user_notification_socket_listener.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/socket/socket_provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

final userNotificationSocketListenerProvider = Provider<void>((ref) {
  final socket = ref.watch(socketProvider);

  if (socket == null) {
    print('[SOCKET-NOTI] socket = null, không gắn listener.');
    return;
  }

  print('[SOCKET-NOTI] Gắn listener cho socket id=${socket.id}');

  // 👇 THÊM ĐOẠN NÀY
  socket.onAny((event, data) {
    print('[SOCKET-NOTI][onAny] event=$event data=$data');
  });

  final controller = ref.read(userNotificationControllerProvider.notifier);

  void refresh() {
    print('[SOCKET-NOTI] gọi controller.refresh()');
    controller.refresh();
  }

  socket.on('order:status_updated', (payload) {
    print('[SOCKET-NOTI] order:status_updated $payload');
    refresh();
  });

  socket.on('order:cancel_requested', (payload) {
    print('[SOCKET-NOTI] order:cancel_requested $payload');
    refresh();
  });

  socket.on('order:return_requested', (payload) {
    print('[SOCKET-NOTI] order:return_requested $payload');
    refresh();
  });

  ref.onDispose(() {
    print('[SOCKET-NOTI] dispose, off listeners');
    socket.off('order:status_updated');
    socket.off('order:cancel_requested');
    socket.off('order:return_requested');
    socket.offAny(); // tắt luôn onAny
  });
});
