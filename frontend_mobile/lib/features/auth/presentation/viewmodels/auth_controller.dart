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
      print('[AuthController] _bootstrap started');
      final refresh = await _tokenStorage.getRefreshToken();
      print('[AuthController] getRefreshToken: $refresh');
      if (refresh == null || refresh.isEmpty) {
        print('[AuthController] No refresh token, setting user to null');
        state = const AsyncData(null);
        print('[AuthController] _bootstrap completed (no token)');
        return;
      }

      print('[AuthController] calling refreshAndGetProfile...');
      final userJson = await _authRepo.refreshAndGetProfile();
      print('[AuthController] refreshAndGetProfile success: ${userJson['email']}');
      final user = UserModel.fromJson(userJson);
      print('[AuthController] UserModel parsed successfully');
      state = AsyncData(user);
      print('[AuthController] _bootstrap completed successfully, user: ${user.email}');
    } catch (e, st) {
      print('[AuthController] _bootstrap error: $e');
      print('[AuthController] stacktrace: $st');
      await _tokenStorage.clearToken();
      state = const AsyncData(null);
      print('[AuthController] _bootstrap completed (error fallback)');
    }
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    try {
      final userJson = await _authRepo.signIn(email: email, password: password);
      final user = UserModel.fromJson(userJson);
      state = AsyncData(user);
      
      // Invalidate all user providers để load data mới cho tài khoản này
      ref.invalidate(profileControllerProvider);
      ref.invalidate(cartControllerProvider);
      ref.invalidate(userNotificationControllerProvider);
      ref.invalidate(couponCenterControllerProvider);
      ref.invalidate(ordersControllerProvider);
      ref.invalidate(catalogControllerProvider);
      ref.invalidate(reviewRepositoryProvider);
      ref.invalidate(addressRepositoryProvider);
      ref.invalidate(botChatControllerProvider);
      ref.invalidate(checkoutControllerProvider);
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
      
      // Invalidate all user providers để load data mới
      ref.invalidate(profileControllerProvider);
      ref.invalidate(cartControllerProvider);
      ref.invalidate(userNotificationControllerProvider);
      ref.invalidate(couponCenterControllerProvider);
      ref.invalidate(ordersControllerProvider);
      ref.invalidate(catalogControllerProvider);
      ref.invalidate(reviewRepositoryProvider);
      ref.invalidate(addressRepositoryProvider);
      ref.invalidate(botChatControllerProvider);
      ref.invalidate(checkoutControllerProvider);
    } catch (e, st) {
      state = AsyncError(e, st);
      // log cho dễ debug, và rethrow để UI biết là fail
      // ignore: avoid_print
      print('signInWithExternalTokens error: $e');
    }
  }

  Future<void> signOut() async {
    print('[AuthController] signOut started');
    await _authRepo.logout();
    state = const AsyncData(null);
    
    // Invalidate ALL user-related providers để reset cache
    print('[AuthController] Invalidating all user providers');
    ref.invalidate(profileControllerProvider);
    ref.invalidate(cartControllerProvider);
    ref.invalidate(userNotificationControllerProvider);
    ref.invalidate(couponCenterControllerProvider);
    ref.invalidate(ordersControllerProvider);
    ref.invalidate(catalogControllerProvider);
    ref.invalidate(reviewRepositoryProvider);
    ref.invalidate(addressRepositoryProvider);
    ref.invalidate(botChatControllerProvider);
    ref.invalidate(checkoutControllerProvider);
    
    print('[AuthController] signOut completed - all cache cleared');
  }
}
