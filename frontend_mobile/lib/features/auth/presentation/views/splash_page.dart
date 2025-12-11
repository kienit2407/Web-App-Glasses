// lib/features/auth/presentation/views/splash_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_color.dart';

class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Lắng nghe thay đổi của authState
    ref.listen(authControllerProvider, (previous, next) {
      next.when(
        loading: () {
          // vẫn ở splash, không làm gì
        },
        data: (user) {
          // user != null: đã login, null: khách
          context.go('/home');
        },
        error: (err, st) {
          // lỗi khi bootstrap -> clear token, hoặc cho vào home guest
          context.go('/home');
        },
      );
    });

    return Scaffold(
      backgroundColor: AppColor.buttonprimaryCol,
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Shop Glasses',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
