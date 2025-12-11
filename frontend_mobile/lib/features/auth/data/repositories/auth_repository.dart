// lib/features/auth/data/repositories/auth_repository.dart
import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/core/network/token_storage.dart';

class AuthRepository {
  final Dio _dio;
  final TokenStorage _tokenStorage;

  AuthRepository({
    required DioClient dioClient,
    required TokenStorage tokenStorage,
  }) : _dio = dioClient.dio,
       _tokenStorage = tokenStorage;

  // 1) Đăng nhập: /auth/login -> lưu token -> /users/me -> trả userJson
  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );

    final body = res.data as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>?;

    if (data == null || data['tokens'] == null) {
      throw Exception('Response login không chứa data.tokens');
    }

    final tokens = data['tokens'] as Map<String, dynamic>;
    final accessToken = tokens['accessToken'] as String?;
    final refreshToken = tokens['refreshToken'] as String?;

    if (accessToken == null || refreshToken == null) {
      throw Exception('Thiếu accessToken / refreshToken');
    }

    await _tokenStorage.saveToken(accessToken, refreshToken);

    // gọi /users/me lấy user
    final meRes = await _dio.get('/users/me');
    final meBody = meRes.data as Map<String, dynamic>;
    final userJson = meBody['data'] as Map<String, dynamic>;

    return userJson;
  }

  // 2) Dùng cho Splash: /auth/refresh -> lưu token mới -> /users/me
  Future<Map<String, dynamic>> refreshAndGetProfile() async {
    final refreshToken = await _tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw Exception('Không có refreshToken');
    }

    final refreshRes = await _dio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    final body = refreshRes.data as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>?;

    if (data == null || data['tokens'] == null) {
      throw Exception('Response refresh không chứa data.tokens');
    }

    final tokens = data['tokens'] as Map<String, dynamic>;
    final newAccess = tokens['accessToken'] as String?;
    final newRefresh = tokens['refreshToken'] as String?;

    if (newAccess == null || newRefresh == null) {
      throw Exception('Thiếu accessToken / refreshToken mới');
    }

    await _tokenStorage.saveToken(newAccess, newRefresh);

    // lại gọi /users/me
    final meRes = await _dio.get('/users/me');
    final meBody = meRes.data as Map<String, dynamic>;
    final userJson = meBody['data'] as Map<String, dynamic>;

    return userJson;
  }

  Future<Map<String, dynamic>> getProfile() async {
    final meRes = await _dio.get('/users/me');
    final meBody = meRes.data as Map<String, dynamic>;
    return meBody['data'] as Map<String, dynamic>;
  }

  Future<void> logout() async {
    await _tokenStorage.clearToken();
  }
}
