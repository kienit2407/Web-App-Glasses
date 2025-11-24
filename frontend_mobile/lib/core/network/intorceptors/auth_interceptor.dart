import 'dart:async';
import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/contants/url_config.dart';

class AuthInterceptor extends Interceptor {
  final Dio dio;
  final Future<String?> Function() getAccessToken;
  final Future<String?> Function() getRefreshToken;
  final Future<void> Function(String access, String refresh) saveToken;

  bool _isRefreshing = false;
  final List<QueuedRequest> _queue = [];

  AuthInterceptor({
    required this.dio,
    required this.getAccessToken,
    required this.getRefreshToken,
    required this.saveToken,
  });

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = await getAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final is401 = err.response?.statusCode == 401;
    final isRefreshCall = err.requestOptions.path == UrlConfig.refreshToken;

    // Không đụng vào lỗi khác & không chui vào chính /refresh
    if (!is401 || isRefreshCall) {
      return handler.next(err);
    }

    // Nếu đang refresh: đưa request hiện tại vào queue, chờ refresh xong
    if (_isRefreshing) {
      final completer = QueuedRequestCompleted();
      _queue.add(
        QueuedRequest(options: err.requestOptions, resolve: completer.resolve),
      );

      return completer.future
          .then((r) => handler.resolve(r))
          .catchError((e) => handler.reject(e));
    }

    // Đây là request đầu tiên bị 401 → tiến hành refresh
    _isRefreshing = true;

    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _isRefreshing = false;
        return handler.reject(err);
      }

      // Gọi refresh: mobile gửi refreshToken trong body
      final res = await dio.post(
        UrlConfig.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      // Tùy theo BE trả về:
      // { status, mgs, success, data: { tokens: { accessToken, refreshToken } } }
      final body = res.data as Map<String, dynamic>;
      final tokens = body['data']['tokens'] as Map<String, dynamic>;
      final newAccess = tokens['accessToken'];
      final newRefresh = tokens['refreshToken'];
      print("test nhận được token mới $newRefresh + $newAccess");
      await saveToken(newAccess, newRefresh);

      // Retry lại request đang fail 401
      final cloned = await dio.fetch(
        err.requestOptions..headers['Authorization'] = 'Bearer $newAccess',
      );

      // Resolve cho request hiện tại
      handler.resolve(cloned);

      // Retry tất cả request trong queue
      for (final req in _queue) {
        req.resolve(
          dio.fetch(
            req.options..headers['Authorization'] = 'Bearer $newAccess',
          ),
        );
      }
      _queue.clear();
    } catch (e) {
      handler.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }
}
// Giả sử như là 10 call api hết cùng hết hạn assessToken đi. Thì nếu k có hàng đợi đó thì cả 10 req đó gọi cùng lúc refresh Token gây ra lỗi crashh Server
// Cái này sẽ lưu lại các req bị lỗi 401 -> hết token thì nó sẽ gọi lại lần lượt các req bị lỗi đó mà tránh bị cresh app server

class QueuedRequest {
  final RequestOptions options; // chứa toàn bộ dữ liệu của request đó
  final void Function(Future<Response> response)
  resolve; // đùng dể chạy lại các request đó

  QueuedRequest({required this.options, required this.resolve});
}

class QueuedRequestCompleted {
  late final Completer<Response> _completer = Completer<Response>();
  Future<Response> get future => _completer.future;

  void resolve(Future<Response> response) async {
    _completer.complete(await response);
  }
}
