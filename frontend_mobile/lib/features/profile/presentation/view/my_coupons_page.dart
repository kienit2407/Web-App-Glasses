// lib/features/coupon/presentation/views/my_coupons_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/coupon/data/model/user_coupon_model.dart';
import 'package:frontend_mobile/core/di/providers.dart';

class MyCouponsPage extends ConsumerWidget {
  const MyCouponsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Xác định provider để dùng chung
    final couponProvider = userCouponControllerProvider(0);
    final state = ref.watch(couponProvider);

    // Hàm xử lý khi người dùng kéo xuống refresh
    Future<void> onRefresh() async {
      // Cách đơn giản nhất: invalidate provider để nó tự động load lại từ đầu
      // Riverpod sẽ huỷ state cũ và gọi lại hàm build/load của provider
      return ref.refresh(couponProvider);
    }

    // Trường hợp đang loading lần đầu tiên (chưa có data)
    if (state.isLoading && state.coupons.isEmpty) {
      return const Scaffold(
        appBar: _MyAppBar(),
        body: Center(child: CircularProgressIndicator.adaptive()),
      );
    }

    final coupons = state.coupons;

    return Scaffold(
      appBar: const _MyAppBar(),
      backgroundColor: const Color(0xfff5f5f5),
      body: RefreshIndicator(
        onRefresh: onRefresh,
        // Màu vòng xoay loading
        color: AppColor.buttonprimaryCol,
        backgroundColor: Colors.white,
        child: _buildBody(context, state, coupons),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    dynamic state,
    List<UserCoupon> coupons,
  ) {
    // 1. Trường hợp có lỗi và không có data
    if (state.errorMessage != null && coupons.isEmpty) {
      return ListView(
        physics:
            const AlwaysScrollableScrollPhysics(), // Quan trọng: Cho phép cuộn để kích hoạt refresh
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                state.errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
            ),
          ),
        ],
      );
    }

    // 2. Trường hợp danh sách trống
    if (coupons.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(), // Quan trọng
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          const Center(
            child: Text(
              'Bạn chưa lưu voucher nào',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ),
        ],
      );
    }

    // 3. Trường hợp có dữ liệu
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      // Luôn cho phép cuộn ngay cả khi ít item (để kéo refresh được)
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: coupons.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final c = coupons[index];
        return _CouponCard(coupon: c);
      },
    );
  }
}

class _MyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _MyAppBar();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: const Text(
        'Voucher của tôi',
        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
      ),
      backgroundColor: AppColor.buttonprimaryCol,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    );
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({required this.coupon});

  final UserCoupon coupon;

  String _formatPrice(int v) {
    return '${v.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context) {
    // Logic: Khả dụng khi chưa hết hạn VÀ chưa bị sử dụng
    final bool isUsable = !coupon.isExpired && !coupon.isUsed;

    // Màu sắc chủ đạo của card tùy theo trạng thái
    final Color cardColor = isUsable ? AppColor.buttonprimaryCol : Colors.grey;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        // Nếu dùng được thì viền màu chính, không thì xám nhạt hoặc ẩn viền
        border: Border.all(
          color: isUsable ? cardColor.withOpacity(0.5) : Colors.transparent,
          width: isUsable ? 1 : 0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.center, // Căn giữa theo chiều dọc
        children: [
          // Icon bên trái
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: isUsable ? Colors.red.shade50 : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.confirmation_number_outlined,
              color: cardColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),

          // Nội dung chính
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Tên/Giá trị giảm giá
                Text(
                  coupon.type == 'percent'
                      ? 'Giảm ${coupon.value}%'
                      : 'Giảm ${_formatPrice(coupon.value)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: isUsable ? Colors.black87 : Colors.grey,
                  ),
                ),

                const SizedBox(height: 4),

                // Trạng thái (Thay thế cho dòng đơn tối thiểu)
                if (coupon.isExpired)
                  const Text(
                    'Đã hết hạn',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.redAccent,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                else if (coupon.isUsed)
                  const Text(
                    'Đã sử dụng',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                else
                  const Text(
                    'Chưa sử dụng',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),

          // Mã code bên phải
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: isUsable
                  ? AppColor.buttonprimaryCol.withOpacity(0.1)
                  : Colors.grey.shade100,
            ),
            child: Text(
              coupon.code,
              style: TextStyle(
                fontSize: 12,
                color: isUsable ? AppColor.buttonprimaryCol : Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
