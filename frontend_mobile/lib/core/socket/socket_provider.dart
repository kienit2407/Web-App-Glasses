// lib/core/socket/socket_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/contants/url_config.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import 'package:frontend_mobile/core/di/providers.dart'; // để lấy auth/token nếu cần

const String kSocketBaseUrl = '${UrlConfig.baseUrl}';

final socketProvider = Provider<IO.Socket?>((ref) {
  final authState = ref.watch(authControllerProvider);
  final user = authState.valueOrNull;

  if (user == null) {
    // chưa login thì không tạo socket
    return null;
  }

  final socket = IO.io(
    kSocketBaseUrl,
    IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect() // tự connect
        .build(),
  );

  socket.onConnect((_) {
    print('[SOCKET] connected id=${socket.id}');
    socket.emit('register_user', user.id); 
    print('[SOCKET] emit register_user with id=${user.id}');
  });

  socket.onDisconnect((_) => print('[SOCKET] disconnected'));
  socket.onError((data) => print('[SOCKET] error: $data'));
  socket.onConnectError((data) => print('[SOCKET] connect_error: $data'));

  ref.onDispose(() {
    socket.dispose();
  });

  return socket;
});
