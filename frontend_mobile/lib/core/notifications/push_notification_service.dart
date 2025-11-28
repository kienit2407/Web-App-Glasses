// import 'package:firebase_messaging/firebase_messaging.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// import 'package:flutter/material.dart';

// import 'package:frontend_mobile/main.dart'; // chỗ khai báo flutterLocalNotificationsPlugin
// import 'package:go_router/go_router.dart';

// class PushNotificationService {
//   static final _messaging = FirebaseMessaging.instance;

//   static Future<void> init() async {
//     // xin quyền (Android 13+ & iOS)
//     await _messaging.requestPermission();

//     // lấy FCM token gửi lên backend
//     final token = await _messaging.getToken();
//     debugPrint('FCM TOKEN: $token');
//     // TODO: gọi API /users/me/devices hoặc tương tự để lưu token trên server

//     // app đang mở (foreground)
//     FirebaseMessaging.onMessage.listen((RemoteMessage message) {
//       _showLocalNotification(message);
//     });

//     // user bấm vào notification khi app đang background / terminated
//     FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
//       _handleMessageClick(message);
//     });

//     // nếu app mở từ trạng thái terminated bởi notification
//     final initialMsg = await _messaging.getInitialMessage();
//     if (initialMsg != null) {
//       _handleMessageClick(initialMsg);
//     }
//   }

//   static void _showLocalNotification(RemoteMessage message) {
//     final notification = message.notification;
//     final android = notification?.android;

//     if (notification == null || android == null) return;

//     final androidDetails = const AndroidNotificationDetails(
//       'order_channel', // id channel
//       'Thông báo đơn hàng',
//       channelDescription: 'Thông báo trạng thái đơn hàng',
//       importance: Importance.max,
//       priority: Priority.high,
//     );

//     final details = NotificationDetails(android: androidDetails);

//     flutterLocalNotificationsPlugin.show(
//       notification.hashCode,
//       notification.title,
//       notification.body,
//       details,
//       payload: message.data['orderId'], // có thể truyền thêm data
//     );
//   }

//   static void _handleMessageClick(RemoteMessage message) {
//     final data = message.data;
//     final orderId = data['orderId'];
//     final orderNumber = data['orderNumber'];

//     // bạn phải có context hoặc GoRouter singleton
//     final router = GoRouter.of(rootNavigatorKey.currentContext!);

//     if (orderId != null && orderNumber != null) {
//       router.goNamed(
//         'orderDetail',
//         pathParameters: {
//           'orderId': orderId,
//           'orderNumber': orderNumber,
//         },
//       );
//     } else {
//       router.goNamed('orders');
//     }
//   }
// }
