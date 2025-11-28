import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:go_router/go_router.dart';

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

    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 150,
            backgroundColor: AppColor.buttonprimaryCol,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xfff9735b), Color(0xfffdc46b)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
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
                          CircleAvatar(
                            radius: 32,
                            backgroundColor: Colors.white,
                            backgroundImage:
                                (user?.avatarUrl != null &&
                                    user!.avatarUrl!.isNotEmpty)
                                ? NetworkImage(user.avatarUrl!) as ImageProvider
                                : null,
                            child:
                                (user?.avatarUrl == null ||
                                    user!.avatarUrl!.isEmpty)
                                ? Text(
                                    _initials(
                                      user?.displayName ?? user?.email ?? 'U',
                                    ),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  )
                                : null,
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
                              user?.displayName ?? user?.email ?? 'Người dùng',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? '',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
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
                        onTap: () => context.pushNamed(
                          'orders',
                          extra: {'status': 'pending'},
                        ),
                      ),
                      _orderShortcut(
                        icon: Icons.local_shipping_outlined,
                        label: 'Đang giao',
                        onTap: () => context.pushNamed(
                          'orders',
                          extra: {'status': 'shipping'},
                        ),
                      ),
                      _orderShortcut(
                        icon: Icons.check_circle_outline,
                        label: 'Hoàn thành',
                        onTap: () => context.pushNamed(
                          'orders',
                          extra: {'status': 'completed'},
                        ),
                      ),
                      _orderShortcut(
                        icon: Icons.cancel_outlined,
                        label: 'Đã hủy',
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

                // --- THIẾT LẬP TÀI KHOẢN ---
                _sectionHeader(title: 'Thiết lập tài khoản', onTap: null),
                Container(
                  color: Colors.white,
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.person_outline),
                        title: const Text('Thông tin & bảo mật'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.pushNamed('account-settings'),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.logout, color: Colors.red),
                        title: const Text(
                          'Đăng xuất',
                          style: TextStyle(color: Colors.red),
                        ),
                        onTap: () async {
                          await ref
                              .read(authControllerProvider.notifier)
                              .signOut();

                          if (context.mounted) {
                            context.goNamed(
                              'home',
                            ); // quay về tab Home, lúc này là khách
                          }
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
        title: const Text('Tài khoản'),
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
                      onPressed: () => context.goNamed('signup'),
                      child: const Text('Đăng ký'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => context.goNamed('signin'),
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
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, size: 26, color: Colors.orange),
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
