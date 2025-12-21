// // utils/toast_utils.dart
// import 'package:flutter/material.dart';
// import 'package:frontend_mobile/main.dart'; // Import cái key vừa tạo

// class ToastUtils {
//   static void showError(String message) {
//     // Xóa các snackbar cũ đang hiện (nếu có)
//     rootScaffoldMessengerKey.currentState?.hideCurrentSnackBar();
    
//     // Hiện cái mới
//     rootScaffoldMessengerKey.currentState?.showSnackBar(
//       SnackBar(
//         content: Text(message),
//         backgroundColor: Colors.red,
//         behavior: SnackBarBehavior.floating,
//       ),
//     );
//   }

//   static void showWarning(String message) {
//     rootScaffoldMessengerKey.currentState?.showSnackBar(
//       SnackBar(
//         content: Text(message),
//         backgroundColor: Colors.orange,
//       ),
//     );
//   }
// }