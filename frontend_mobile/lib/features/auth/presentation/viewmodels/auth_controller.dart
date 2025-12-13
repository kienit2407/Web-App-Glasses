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
    print('[AuthController] bootstrap called');
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
      ref.invalidate(profileControllerProvider);
      ref.invalidate(cartControllerProvider);
      ref.invalidate(userNotificationControllerProvider);
    } catch (e, st) {
      // Cập nhật state để UI biết là có lỗi (nếu muốn show message đẹp)
      state = AsyncError(e, st);

      // LOG CHO DEV THÔI, KHÔNG rethrow
      // ignore: avoid_print
      print('SignIn error: $e');

      // KHÔNG rethrow;  <-- xóa dòng này
    }
  }

  Future<void> signInWithExternalTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    state = const AsyncLoading();
    try {
      await _tokenStorage.saveToken(accessToken, refreshToken);

      final userJson = await _authRepo.getProfile();
      final user = UserModel.fromJson(userJson);
      state = AsyncData(user);
      ref.invalidate(profileControllerProvider);
      ref.invalidate(cartControllerProvider);
      ref.invalidate(userNotificationControllerProvider);
    } catch (e, st) {
      state = AsyncError(e, st);
      // log cho dễ debug, và rethrow để UI biết là fail
      // ignore: avoid_print
      print('signInWithExternalTokens error: $e');
    }
  }

  Future<void> signOut() async {
    await _authRepo.logout();
    state = const AsyncData(null);
    ref.invalidate(profileControllerProvider);
    ref.invalidate(cartControllerProvider);
    ref.invalidate(userNotificationControllerProvider);
  }
}
