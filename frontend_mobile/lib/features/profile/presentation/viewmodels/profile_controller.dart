import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/profile/data/repository/profile_repository.dart';
import 'package:frontend_mobile/features/profile/presentation/viewmodels/profile_state.dart';

class ProfileController extends StateNotifier<ProfileState> {
  ProfileController(this._repo) : super(ProfileState.initial());

  final ProfileRepository _repo;

  /// Gọi ở initState lần đầu để lấy thông tin user
  Future<void> loadProfile() async {
    try {
      state = state.copyWith(loading: true, errorMessage: null);
      final user = await _repo.getMe();
      state = state.copyWith(user: user, loading: false);
    } catch (e) {
      state = state.copyWith(loading: false, errorMessage: e.toString());
    }
  }

  Future<void> updateProfile({
    required String displayName,
    File? avatarFile,
  }) async {
    try {
      state = state.copyWith(savingProfile: true, errorMessage: null);

      final updatedUser = await _repo.updateMe(
        displayName: displayName.trim(),
        avatarFile: avatarFile,
      );

      state = state.copyWith(user: updatedUser, savingProfile: false);
    } catch (e) {
      print('[ProfileController] updateProfile error: $e');
      state = state.copyWith(savingProfile: false, errorMessage: e.toString());
    }
  }

  /// Cập nhật tên hiển thị
  Future<void> updateDisplayName(String displayName) async {
    if (displayName.trim().isEmpty) return;

    try {
      state = state.copyWith(savingProfile: true, errorMessage: null);
      final user = await _repo.updateProfile(displayName: displayName.trim());
      state = state.copyWith(user: user, savingProfile: false);
    } catch (e) {
      state = state.copyWith(savingProfile: false, errorMessage: e.toString());
    }
  }

  /// Upload avatar mới
  Future<void> updateAvatar(File file) async {
    try {
      state = state.copyWith(uploadingAvatar: true, errorMessage: null);
      final user = await _repo.uploadAvatar(file);
      state = state.copyWith(user: user, uploadingAvatar: false);
    } catch (e) {
      state = state.copyWith(
        uploadingAvatar: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Đổi mật khẩu
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      state = state.copyWith(changingPassword: true, errorMessage: null);
      await _repo.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      state = state.copyWith(changingPassword: false);
    } catch (e) {
      state = state.copyWith(
        changingPassword: false,
        errorMessage: e.toString(),
      );
    }
  }
}
