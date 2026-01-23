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
      print('[SplashPage] Auth state changed: previous=${previous?.runtimeType}, next=${next.runtimeType}');
      
      next.when(
        loading: () {
          print('[SplashPage] Auth is loading...');
          // vẫn ở splash, không làm gì
        },
        data: (user) {
          print('[SplashPage] Auth data loaded. User: ${user?.email}');
          // user != null: đã login, null: khách
          // Delay để ensure navigation được handle đúng
          Future.delayed(const Duration(milliseconds: 500), () {
            print('[SplashPage] Navigating to /home');
            context.go('/home');
          });
        },
        error: (err, st) {
          print('[SplashPage] Auth error: $err');
          // lỗi khi bootstrap -> clear token, hoặc cho vào home guest
          Future.delayed(const Duration(milliseconds: 500), () {
            print('[SplashPage] Navigating to /home (error fallback)');
            context.go('/home');
          });
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
