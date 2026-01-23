import 'package:frontend_mobile/features/auth/data/models/user_model.dart';

class ProfileState {
  final UserModel? user;

  const ProfileState({
    this.user,
  });

  ProfileState copyWith({
    UserModel? user,
  }) {
    return ProfileState(
      user: user ?? this.user,
    );
  }
}
