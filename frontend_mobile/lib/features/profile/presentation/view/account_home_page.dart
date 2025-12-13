import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class AccountHomePage extends ConsumerStatefulWidget {
  const AccountHomePage({super.key});

  @override
  ConsumerState<AccountHomePage> createState() => _AccountHomePageState();
}

class _AccountHomePageState extends ConsumerState<AccountHomePage> {
  @override
  void initState() {
    super.initState();
    // load profile lần đầu
    Future.microtask(() {
      ref.read(profileControllerProvider.notifier).loadProfile();
      ref.read(ordersControllerProvider.notifier).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final authUser = authState.valueOrNull;

    // Nếu chưa đăng nhập -> hiển thị giao diện guest
    if (authUser == null) {
      return _buildGuestAccount(context);
    }

    // Đã đăng nhập -> như cũ
    final state = ref.watch(profileControllerProvider);
    final user = state.user;

    final ordersState = ref.watch(ordersControllerProvider);
    final counts = ordersState.statusCounts;

    // Tính 4 con số cho 4 icon
    final pendingCount = counts['pending'] ?? 0;
    final shippingCount =
        (counts['shipping'] ?? 0) + (counts['delivering'] ?? 0);
    final deliveredCount = counts['delivered'] ?? 0;
    final cancelledCount = counts['cancelled'] ?? 0;
    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      body: RefreshIndicator.adaptive(
        edgeOffset: 40,
        color: Colors.white,
        onRefresh: () =>
            ref.read(profileControllerProvider.notifier).loadProfile(),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              systemOverlayStyle: SystemUiOverlayStyle.light,
              actions: [
                IconButton(
                  icon: const Icon(Iconsax.message_question),
                  onPressed: () => context.pushNamed('ai-chat'),
                ),
              ],
              pinned: true,
              expandedHeight: 150,

              backgroundColor: AppColor.buttonprimaryCol,
              foregroundColor: Colors.white,
              flexibleSpace: FlexibleSpaceBar(
                collapseMode: CollapseMode.none,
                background: GestureDetector(
                  onTap: () => context.pushNamed('account-settings'),
                  child: InkWell(
                    child: Container(
                      width: double.infinity,
                      height: double.infinity,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xff251E4C),
                            Color(0xff341D5C),
                            Color(0xff6B2E7C),
                          ],
                          begin: Alignment.centerRight,
                          end: Alignment.centerLeft,
                        ),
                        image: DecorationImage(
                          image: AssetImage(AppImage.nitro1),

                          fit: BoxFit.fill,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.only(
                          left: 16,
                          right: 16,
                          bottom: 24,
                          top: 56,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Stack(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(8.0),
                                  child: CircleAvatar(
                                    radius: 32,
                                    backgroundColor: Colors.white,
                                    backgroundImage:
                                        (user?.avatarUrl != null &&
                                            user!.avatarUrl!.isNotEmpty)
                                        ? NetworkImage(user.avatarUrl!)
                                              as ImageProvider
                                        : null,
                                    child:
                                        (user?.avatarUrl == null ||
                                            user!.avatarUrl!.isEmpty)
                                        ? Text(
                                            _initials(
                                              user?.displayName ??
                                                  user?.email ??
                                                  'U',
                                            ),
                                            style: const TextStyle(
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          )
                                        : null,
                                  ),
                                ),
                                Positioned(
                                  top: 0,
                                  left: 0,
                                  child: Image.asset(
                                    AppImage.avtFrame2,
                                    width: 77,
                                    height: 77,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.displayName ??
                                        user?.email ??
                                        'Người dùng',
                                    style: const TextStyle(
                                      color: Color(0xffA15EAB),
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    user?.email ?? '',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // --- ĐƠN MUA CỦA TÔI ---
            SliverToBoxAdapter(
              child: Column(
                children: [
                  const SizedBox(height: 8),
                  _sectionHeader(
                    title: 'Đơn mua của tôi',
                    actionText: 'Xem lịch sử',
                    onTap: () => context.pushNamed('orders'),
                  ),
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _orderShortcut(
                          icon: Icons.pending_actions_outlined,
                          label: 'Chờ xác nhận',
                          badgeCount: pendingCount,
                          onTap: () => context.pushNamed(
                            'orders',
                            extra: {'status': 'pending'},
                          ),
                        ),
                        _orderShortcut(
                          icon: Icons.local_shipping_outlined,
                          label: 'Đang giao',
                          badgeCount: shippingCount,
                          onTap: () => context.pushNamed(
                            'orders',
                            extra: {'status': 'shipping'},
                          ),
                        ),
                        _orderShortcut(
                          icon: Icons.check_circle_outline,
                          label: 'Hoàn thành',
                          badgeCount: deliveredCount, // 👈
                          onTap: () => context.pushNamed(
                            'orders',
                            extra: {'status': 'delivered'},
                          ),
                        ),
                        _orderShortcut(
                          icon: Icons.cancel_outlined,
                          label: 'Đã hủy',
                          badgeCount: cancelledCount,
                          onTap: () => context.pushNamed(
                            'orders',
                            extra: {'status': 'cancelled'},
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // --- VÍ & ƯU ĐÃI ---
                  _sectionHeader(title: 'Ví & Ưu đãi', onTap: null),
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _simpleShortcut(
                          icon: Icons.card_giftcard_outlined,
                          label: 'Voucher của tôi',
                          onTap: () => context.pushNamed('my-coupons'),
                        ),
                        _simpleShortcut(
                          icon: Icons.location_on_outlined,
                          label: 'Địa chỉ giao hàng',
                          onTap: () => context.pushNamed('my-addresses'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  _sectionHeader(title: 'Thiết lập tài khoản', onTap: null),
                  Container(
                    color: Colors.white,
                    child: Column(
                      children: [
                        ListTile(
                          leading: const Icon(Icons.person_outline),
                          title: const Text(
                            'Thông tin & bảo mật',
                            style: TextStyle(fontSize: 12),
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.pushNamed('account-settings'),
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.logout, color: Colors.red),
                          title: const Text(
                            'Đăng xuất',
                            style: TextStyle(color: Colors.red, fontSize: 12),
                          ),
                          onTap: () async {
                            showAdaptiveDialog(
                              context: context,
                              builder: (ctx) {
                                return CupertinoAlertDialog(
                                  title: const Text('Đăng xuất'),
                                  content: const Text(
                                    'Bạn có chắc chắn muốn đăng xuất không?',
                                  ),
                                  actions: [
                                    CupertinoDialogAction(
                                      onPressed: () => Navigator.pop(ctx),
                                      child: const Text(
                                        'Huỷ',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontSize: 14,
                                        ),
                                      ), // Mặc định là màu xanh chuẩn iOS
                                    ),
                                    CupertinoDialogAction(
                                      isDefaultAction:
                                          true, // Làm chữ In Đậm (Bold)
                                      onPressed: () async {
                                        await ref
                                            .read(
                                              authControllerProvider.notifier,
                                            )
                                            .signOut();
                                        Navigator.pop(ctx);
                                        if (context.mounted) {
                                          // Dùng go (xoá stack) thay vì push để không back lại được
                                          context.go('/home');
                                        }
                                      },

                                      textStyle: const TextStyle(
                                        color: Color(
                                          0xff007AFF,
                                        ), // Hoặc Colors.blue
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                      child: const Text('Đồng ý'),
                                    ),
                                  ],
                                );
                              },
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader({
    required String title,
    String? actionText,
    VoidCallback? onTap,
  }) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          if (actionText != null && onTap != null)
            InkWell(
              onTap: onTap,
              child: Row(
                children: [
                  Text(
                    actionText,
                    style: const TextStyle(fontSize: 12, color: Colors.blue),
                  ),
                  const Icon(Icons.chevron_right, size: 18, color: Colors.blue),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGuestAccount(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      appBar: AppBar(
        title: const Text(
          'Tài khoản',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_outline, size: 80, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Bạn chưa đăng nhập',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Đăng nhập để xem đơn hàng, voucher và quản lý tài khoản.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              // 2 nút nằm NGANG nhau
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColor.buttonprimaryCol),
                        foregroundColor: AppColor.buttonprimaryCol,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => context.pushNamed('signup'),
                      child: const Text('Đăng ký'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => context.pushNamed('signin'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColor.buttonprimaryCol,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Đăng nhập'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _orderShortcut({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(icon, size: 26, color: Colors.orange),
              if (badgeCount > 0)
                Positioned(
                  right: -8,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.red.shade600,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badgeCount > 99 ? '99+' : '$badgeCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11)),
        ],
      ),
    );
  }

  Widget _simpleShortcut({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, size: 24, color: AppColor.buttonprimaryCol),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }
}
