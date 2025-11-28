import 'dart:io';

import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/auth/data/models/user_model.dart';

/// Làm việc với các API:
/// - GET   /users/me
/// - PATCH /users/me
/// - PATCH /users/me/password
class ProfileRepository {
  final DioClient dioClient;

  ProfileRepository({required this.dioClient});

  /// Lấy thông tin tài khoản hiện tại
  Future<UserModel> getMe() async {
    final res = await dioClient.dio.get('/users/me');
    final data = res.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Cập nhật display_name (không đổi avatar)
  Future<UserModel> updateProfile({
    required String displayName,
  }) async {
    final res = await dioClient.dio.patch(
      '/users/me',
      data: {
        'display_name': displayName,
      },
    );
    final data = res.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Upload avatar mới (field "file" – đúng với backend bạn đang dùng)
  Future<UserModel> uploadAvatar(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });

    final res = await dioClient.dio.patch(
      '/users/me',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );

    final data = res.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Đổi mật khẩu
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    await dioClient.dio.patch(
      '/users/me/password',
      data: {
        'current_password': currentPassword,
        'new_password': newPassword,
        'confirm_password': confirmPassword,
      },
    );
  }
}
