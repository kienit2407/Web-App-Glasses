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
        Future.microtask(() {
          if (user == null) {
            context.go('/signin');
          } else {
            context.go('/home');
          }
        });
      },
      error: (err, st) {
        // có lỗi khi bootstrap => coi như chưa login
        Future.microtask(() => context.go('/signin'));
      },
    );

    return Scaffold(
      backgroundColor: AppColor.buttonprimaryCol,
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'My Ecommerce',
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
