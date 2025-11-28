// lib/features/auth/presentation/views/splash_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_color.dart';
import '../viewmodels/auth_controller.dart';

class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);

    authState.when(
      loading: () {
        // đang bootstrap (refresh token, gọi profile ...)
        // => cứ hiển thị UI splash thôi, không navigate
      },
      data: (user) {
        // user != null => đã login, null => chưa login
        // DÙ login hay chưa, đều vào /home
        Future.microtask(() {
          context.go('/home');
        });
      },
      error: (err, st) {
        // Có lỗi khi bootstrap => vẫn cho vào home với vai trò khách
        Future.microtask(() {
          context.go('/home');
        });
      },
    );

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
