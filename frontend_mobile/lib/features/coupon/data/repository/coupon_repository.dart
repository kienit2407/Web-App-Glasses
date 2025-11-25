// lib/features/coupon/data/repository/coupon_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/coupon/data/model/user_coupon_model.dart';

class CouponRepository {
  final DioClient dioClient;

  CouponRepository(this.dioClient);

  /// GET /users/me/coupons?subtotal=xxx
  Future<List<UserCoupon>> getMyCoupons({required int subtotal}) async {
    final res = await dioClient.dio.get(
      '/users/me/coupons',
      queryParameters: {'subtotal': subtotal},
    );

    // DEBUG nếu cần:
    // print('COUPON RES = ${res.data}');

    final data = res.data['data'];

    // Case 1: { data: [ ... ] }
    if (data is List) {
      final list = data
          .map((e) => UserCoupon.fromJson(e as Map<String, dynamic>))
          .toList();
      // print('COUPON LENGTH (list) = ${list.length}');
      return list;
    }

    // Case 2: { data: { items: [ ... ] } }  <-- GIỐNG WEB
    if (data is Map<String, dynamic> && data['items'] is List) {
      final list = (data['items'] as List)
          .map((e) => UserCoupon.fromJson(e as Map<String, dynamic>))
          .toList();
      // print('COUPON LENGTH (items) = ${list.length}');
      return list;
    }

    // Case 3: { data: { coupons: [ ... ] } } (phòng xa)
    if (data is Map<String, dynamic> && data['coupons'] is List) {
      final list = (data['coupons'] as List)
          .map((e) => UserCoupon.fromJson(e as Map<String, dynamic>))
          .toList();
      // print('COUPON LENGTH (coupons) = ${list.length}');
      return list;
    }

    // print('COUPON LENGTH = 0 (unknown shape)');
    return [];
  }
}
