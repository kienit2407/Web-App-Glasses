// import 'package:frontend_mobile/core/network/dio_config.dart';
// import 'package:frontend_mobile/core/network/token_storage.dart';
// import 'package:frontend_mobile/features/auth/data/repositories/auth_repository.dart';
// import 'package:get_it/get_it.dart';

// final getIt = GetIt.instance;
// //khởi tạo hàm để khởi động getit
// Future<void> initializeGetit() async {
//   // DioClient là async factory
//   getIt.registerSingletonAsync<DioClient>(() async => await DioClient.create());

//   // TokenStorage
//   getIt.registerLazySingleton<TokenStorage>(() => TokenStorage());

//   // AuthRepository phụ thuộc DioClient + TokenStorage
//   getIt.registerLazySingleton<AuthRepository>(() {
//     final dioClient = getIt<DioClient>();
//     final tokenStorage = getIt<TokenStorage>();
//     return AuthRepository(dioClient: dioClient, tokenStorage: tokenStorage);
//   });

//   await getIt.allReady();
// }
