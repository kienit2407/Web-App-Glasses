import 'package:flutter/material.dart';

Future<Future<Object?>> showAnimatedDialog({
  required BuildContext context,
  required Widget dialog,
}) async {
  // Giữ lại context bên ngoài (vẫn còn sống sau khi dialog build)
  final rootContext = context;

  // Hẹn giờ đóng dialog sau 2s
  Future.delayed(const Duration(seconds: 2), () {
    // Nếu trong 2s user đã tự đóng dialog thì canPop sẽ là false
    if (Navigator.of(rootContext).canPop()) {
      Navigator.of(rootContext).pop();
    }
  });

  return showGeneralDialog(
    context: rootContext,
    barrierDismissible: true,
    barrierLabel: '',
    transitionDuration: const Duration(milliseconds: 300),
    pageBuilder: (_, __, ___) => dialog,
    transitionBuilder: (context, animation, secondaryAnimation, child) {
      return ScaleTransition(
        scale: CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
        child: FadeTransition(opacity: animation, child: child),
      );
    },
  );
}

