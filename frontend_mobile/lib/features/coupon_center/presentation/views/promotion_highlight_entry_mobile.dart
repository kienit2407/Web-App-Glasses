import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/common/count_down_promo.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/coupon_center/data/models/coupon_center_models.dart';

class PromotionHighlightEntryMobile extends ConsumerStatefulWidget {
  const PromotionHighlightEntryMobile({super.key});

  @override
  ConsumerState<PromotionHighlightEntryMobile> createState() =>
      _PromotionHighlightEntryMobileState();
}

class _PromotionHighlightEntryMobileState
    extends ConsumerState<PromotionHighlightEntryMobile> {
  bool _requested = false;
  bool _dialogShown = false;

  @override
  void initState() {
    super.initState();
    // gọi API highlight 1 lần khi widget mount
    Future.microtask(() async {
      if (_requested) return;
      _requested = true;

      // Nếu bạn muốn chỉ load highlight:
      // await ref.read(couponCenterControllerProvider.notifier).loadHighlightOnly();

      // Hoặc tận dụng loadAll (fetch coupons + promotions + highlight)
      await ref.read(couponCenterControllerProvider.notifier).loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    // listen state.highlight để show dialog đúng 1 lần
    ref.listen(couponCenterControllerProvider, (prev, next) async {
      if (_dialogShown) return;
      final promo = next.highlight;
      if (promo == null) return;

      _dialogShown = true;

      if (!mounted) return;
      final shouldClose = await showDialog<bool>(
        context: context,
        barrierDismissible: true,
        builder: (_) {
          return Dialog(
            backgroundColor: Colors.transparent,
            elevation: 0,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 24,
            ),
            child: _PromotionHighlightDialogContent(promo: promo),
          );
        },
      );

      if (shouldClose == true && mounted) {
        await ref
            .read(couponCenterControllerProvider.notifier)
            .dismissHighlight();
      }
    });

    // không render gì ra UI
    return const SizedBox.shrink();
  }
}

class _PromotionHighlightDialogContent extends StatelessWidget {
  const _PromotionHighlightDialogContent({required this.promo});

  final HighlightPromotion promo;

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.of(context).size.width * 0.85;

    return Center(
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Banner + countdown
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (promo.bannerUrl != null)
                  Image.network(
                    promo.bannerUrl!,
                    width: maxWidth,
                    fit: BoxFit.cover,
                  ),
                // thanh countdown bên dưới banner
                Container(
                  width: maxWidth,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  color: Colors.black.withOpacity(0.35),
                  child: Center(
                    child: PromotionCountdownChip(
                      startDate: promo.startDate,
                      endDate: promo.endDate,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // nút X nổi phía trên
          Positioned(
            right: -4,
            top: -4,
            child: IconButton(
              onPressed: () => Navigator.of(context).pop(true),
              icon: const Icon(Icons.close, color: Colors.white, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withOpacity(0.6),
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


