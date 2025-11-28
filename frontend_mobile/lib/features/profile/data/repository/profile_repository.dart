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

  Future<UserModel> updateMe({String? displayName, File? avatarFile}) async {
    Response res;

    // Nếu có file -> dùng multipart/form-data
    if (avatarFile != null) {
      final formData = FormData.fromMap({
        if (displayName != null) 'display_name': displayName,
        'file': await MultipartFile.fromFile(avatarFile.path),
      });

      res = await dioClient.dio.patch(
        '/users/me',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
    } else {
      // Không có file -> gửi JSON bình thường
      res = await dioClient.dio.patch(
        '/users/me',
        data: {if (displayName != null) 'display_name': displayName},
      );
    }

    final data = res.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Cập nhật display_name (không đổi avatar) – dùng lại updateMe
  Future<UserModel> updateProfile({required String displayName}) async {
    return updateMe(displayName: displayName);
  }

  /// Upload avatar mới (field "file")
  Future<UserModel> uploadAvatar(File file) async {
    return updateMe(avatarFile: file);
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
