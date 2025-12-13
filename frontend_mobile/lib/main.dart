
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/core/network/token_storage.dart';
import 'package:frontend_mobile/core/routes/app_routes.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
// // dùng cho message khi app đang ở background
// @pragma('vm:entry-point')
// Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
//   await Firebase.initializeApp();
//   // TODO: xử lý logic nếu cần
//   print('BG message: ${message.messageId}');
// }

// final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
//     FlutterLocalNotificationsPlugin();
void main() async {
  // guardiantee to fluter started first!
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    systemNavigationBarColor: Colors.transparent, // Làm trong suốt thanh dưới đáy Android
    statusBarColor: Colors.transparent,
  ));
  // 1. Tạo DioClient & TokenStorage một lần
  final dioClient = await DioClient.create();
  final tokenStorage = TokenStorage();
  // await initializeGetit();
  await Hive.initFlutter();
  // await Firebase.initializeApp();
  // // await PushNotificationService.init();
  // FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // cấu hình local notification (để hiện notification khi app đang mở)
  // const AndroidInitializationSettings androidInit =
  //     AndroidInitializationSettings('@mipmap/ic_launcher');
  // const InitializationSettings initSettings =
  //     InitializationSettings(android: androidInit);
  // await flutterLocalNotificationsPlugin.initialize(
  //   initSettings,
  //   onDidReceiveNotificationResponse: (response) {
  //     // TODO: điều hướng tới orderDetail nếu cần
  //   },
  // );
  // 2. Chạy app với ProviderScope + override
  runApp(
    ProviderScope(
      overrides: [
        dioClientProvider.overrideWithValue(dioClient),
        tokenStorageProvider.overrideWithValue(tokenStorage),
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

    return MaterialApp.router(
      title: 'My Ecommerce',
      routerConfig: router, 
      debugShowCheckedModeBanner: false,

    );
  }
}
