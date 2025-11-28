import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/core/network/token_storage.dart';
import 'package:frontend_mobile/core/routes/app_routes.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

void main() async {
  // guardiantee to fluter started first!
  WidgetsFlutterBinding.ensureInitialized();
  // 1. Tạo DioClient & TokenStorage một lần
  final dioClient = await DioClient.create();
  final tokenStorage = TokenStorage();
  // await initializeGetit();
  await Hive.initFlutter();
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
