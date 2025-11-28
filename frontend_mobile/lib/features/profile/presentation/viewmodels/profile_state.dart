import 'package:frontend_mobile/features/auth/data/models/user_model.dart';

class ProfileState {
  final UserModel? user;

  final bool loading;            // load info
  final bool savingProfile;      // lưu tên hiển thị
  final bool uploadingAvatar;    // upload avatar
  final bool changingPassword;   // đổi mật khẩu

  final String? errorMessage;

  const ProfileState({
    this.user,
    this.loading = false,
    this.savingProfile = false,
    this.uploadingAvatar = false,
    this.changingPassword = false,
    this.errorMessage,
  });

  factory ProfileState.initial() => const ProfileState();

  ProfileState copyWith({
    UserModel? user,
    bool? loading,
    bool? savingProfile,
    bool? uploadingAvatar,
    bool? changingPassword,
    String? errorMessage,
  }) {
    return ProfileState(
      user: user ?? this.user,
      loading: loading ?? this.loading,
      savingProfile: savingProfile ?? this.savingProfile,
      uploadingAvatar: uploadingAvatar ?? this.uploadingAvatar,
      changingPassword: changingPassword ?? this.changingPassword,
      errorMessage: errorMessage,
    );
  }
}
