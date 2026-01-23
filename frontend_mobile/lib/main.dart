// import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';

// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:frontend_mobile/core/di/providers.dart';
// import 'package:frontend_mobile/core/network/dio_config.dart';
// import 'package:frontend_mobile/core/network/token_storage.dart';
// import 'package:frontend_mobile/core/routes/app_routes.dart';
// import 'package:hive_ce_flutter/hive_flutter.dart';
// // // dùng cho message khi app đang ở background
// // @pragma('vm:entry-point')
// // Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
// //   await Firebase.initializeApp();
// //   // TODO: xử lý logic nếu cần
// //   print('BG message: ${message.messageId}');
// // }

// // final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
// //     FlutterLocalNotificationsPlugin();

// // Khai báo biến toàn cục cho thông báo
// final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
//     GlobalKey<ScaffoldMessengerState>();
// void main() async {
//   // guardiantee to fluter started first!
//   WidgetsFlutterBinding.ensureInitialized();
//   SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
//   SystemChrome.setSystemUIOverlayStyle(
//     const SystemUiOverlayStyle(
//       systemNavigationBarColor:
//           Colors.transparent, // Làm trong suốt thanh dưới đáy Android
//       statusBarColor: Colors.transparent,
//     ),
//   );
//   await Hive.initFlutter();
//   // 1. Tạo DioClient & TokenStorage một lần
//   final tokenStorage = TokenStorage();
//   await tokenStorage.getAccessToken();
//   final dioClient = await DioClient.create(tokenStorage: tokenStorage);

//   // 2. Chạy app với ProviderScope + override
//   runApp(
//     ProviderScope(
//       overrides: [
//         dioClientProvider.overrideWithValue(dioClient),
//         tokenStorageProvider.overrideWithValue(tokenStorage),
//       ],
//       child: const MyApp(),
//     ),
//   );
// }

// class MyApp extends ConsumerWidget {
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     final router = ref.watch(appRouterProvider);

//     return MaterialApp.router(
//       scaffoldMessengerKey: rootScaffoldMessengerKey,
//       title: 'My Ecommerce',
//       routerConfig: router,
//       debugShowCheckedModeBanner: false,
//     );
//   }
// }

// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/core/routes/app_routes.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:toastification/toastification.dart';

import 'core/di/providers.dart';
import 'core/network/token_storage.dart';
import 'core/contants/url_config.dart';
import 'core/utils/device_id_storage.dart';

Future<(String accessToken, String refreshToken)> refreshTokensFromApi(
  DioClient client,
  String refreshToken,
) async {
  final res = await client.post<Map<String, dynamic>>(
    '/auth/refresh-token',
    data: {'refreshToken': refreshToken},
  );

  final data = res.data ?? {};
  final access = data['accessToken'] as String;
  final refresh = data['refreshToken'] as String;
  return (access, refresh);
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // WidgetsFlutterBinding.ensureInitialized();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        systemNavigationBarColor:
            Colors.transparent, // Làm trong suốt thanh dưới đáy Android
        statusBarColor: Colors.transparent,
      ),
    );
  await Hive.initFlutter();

  final tokenStorage = TokenStorage();
  await tokenStorage.init();

  final deviceId = await DeviceIdStorage().getDeviceId();

  late final DioClient dioClient;
  dioClient = await DioClient.create(
    tokenStorage: tokenStorage,
    baseUrl: UrlConfig.baseUrl,
    deviceId: deviceId,
    refreshTokens: (refreshToken) => refreshTokensFromApi(dioClient, refreshToken),
  );

  runApp(
    ProviderScope(
      overrides: [
        tokenStorageProvider.overrideWithValue(tokenStorage),
        dioClientProvider.overrideWithValue(dioClient),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    
    // Watch auth sync provider - nó sẽ tự động invalidate data khi auth thay đổi
    ref.watch(authSyncProvider);

    // Watch auth state để log
    final authState = ref.watch(authControllerProvider);
    authState.whenData((user) {
      print('[MyApp] Auth state changed: ${user?.email ?? 'guest'}');
    });

    return ToastificationWrapper(
      child: MaterialApp.router(
        title: 'My Ecommerce',
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
