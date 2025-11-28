// lib/features/coupon_center/data/repository/coupon_center_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/coupon_center/data/models/coupon_center_models.dart';

class CouponCenterRepository {
  final DioClient dioClient;

  CouponCenterRepository({required this.dioClient});

  Future<List<CouponCenterItem>> getCoupons() async {
    final res = await dioClient.dio.get('/coupons');
    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['items'] as List<dynamic>? ?? [];
    return list
        .map((e) => CouponCenterItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PromotionCenterItem>> getPromotions() async {
    final res = await dioClient.dio.get('/promotions/center');
    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['items'] as List<dynamic>? ?? [];
    return list
        .map((e) => PromotionCenterItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Trả về highlight, hoặc null nếu không có / đã seen
  Future<HighlightPromotion?> getHighlight() async {
    final res = await dioClient.dio.get('/promotions/highlight');
    final data = res.data['data'] as Map<String, dynamic>?;

    if (data == null) return null;
    final alreadySeen = data['already_seen'] == true;
    final promoJson = data['promotion'];

    if (promoJson == null || alreadySeen) return null;

    return HighlightPromotion.fromJson(
      promoJson as Map<String, dynamic>,
    );
  }

  Future<void> markHighlightSeen(String promotionId) async {
    await dioClient.dio.post('/promotions/$promotionId/seen');
  }

  Future<void> saveCoupon(String code) async {
    await dioClient.dio.post('/coupons/claim/$code');
  }
}


