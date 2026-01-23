import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/profile/data/repository/profile_repository.dart';
import 'package:frontend_mobile/features/profile/presentation/viewmodels/profile_state.dart';

class ProfileController extends StateNotifier<ProfileState> {
  ProfileController(this._repo) : super(const ProfileState()) {
    // Tự động load profile khi controller được tạo
    loadProfile();
  }

  final ProfileRepository _repo;

  /// Gọi ở initState lần đầu để lấy thông tin user
  Future<void> loadProfile() async {
    try {
      final user = await _repo.getMe();
      state = state.copyWith(user: user);
    } catch (e) {
      print('[ProfileController] loadProfile error: $e');
    }
  }

  Future<void> updateProfile({
    required String displayName,
    File? avatarFile,
  }) async {
    try {
      final updatedUser = await _repo.updateMe(
        displayName: displayName.trim(),
        avatarFile: avatarFile,
      );
      state = state.copyWith(user: updatedUser);
    } catch (e) {
      print('[ProfileController] updateProfile error: $e');
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      await _repo.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
    } catch (e) {
      print('[ProfileController] changePassword error: $e');
    }
  }
}
