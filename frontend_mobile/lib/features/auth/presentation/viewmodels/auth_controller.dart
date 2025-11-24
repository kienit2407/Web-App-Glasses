

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/network/token_storage.dart';
import 'package:frontend_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:frontend_mobile/features/auth/data/models/user_model.dart'; 

class AuthController extends StateNotifier<AsyncValue<UserModel?>> {
  AuthController(this.ref) : super(const AsyncLoading()) {
    _bootstrap();
  }

  final Ref ref;

  AuthRepository get _authRepo => ref.read(authRepositoryProvider);
  TokenStorage get _tokenStorage => ref.read(tokenStorageProvider);

  bool get isLoggedIn => state.hasValue && state.value != null;

  Future<void> _bootstrap() async {
    try {
      final refresh = await _tokenStorage.getRefreshToken();
      if (refresh == null || refresh.isEmpty) {
        state = const AsyncData(null);
        return;
      }

      final userJson = await _authRepo.refreshAndGetProfile();
      final user = UserModel.fromJson(userJson);
      state = AsyncData(user);
    } catch (_) {
      await _tokenStorage.clearToken();
      state = const AsyncData(null);
    }
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    try {
      final userJson = await _authRepo.signIn(email: email, password: password);
      final user = UserModel.fromJson(userJson);
      state = AsyncData(user);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _authRepo.logout();
    state = const AsyncData(null);
  }
}
