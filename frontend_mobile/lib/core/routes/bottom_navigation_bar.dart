// lib/main_shell.dart
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/coupon_center/presentation/views/coupon_center_page.dart';
import 'package:frontend_mobile/features/coupon_center/presentation/views/promotion_highlight_entry_mobile.dart';
import 'package:frontend_mobile/features/home/presentation/views/home_page.dart';
import 'package:frontend_mobile/features/notifications/presentation/listener/user_notification_socket_listener.dart';
import 'package:frontend_mobile/features/profile/presentation/view/account_home_page.dart';
import 'package:frontend_mobile/features/notifications/presentation/views/user_notifications_page.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _index = 0;

  final _pages = const [
    HomePage(),
    CouponCenterPage(),
    UserNotificationsPage(),
    AccountHomePage(),
  ];

  @override
  Widget build(BuildContext context) {
    ref.watch(userNotificationSocketListenerProvider);

    final notifState = ref.watch(userNotificationControllerProvider);
    final unread = notifState.unreadCount;

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          IndexedStack(index: _index, children: _pages),
          const PromotionHighlightEntryMobile(),
        ],
      ),
      bottomNavigationBar: Transform.translate(
        offset: const Offset(0, 20),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 35, sigmaY: 35),
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColor.textpriCol.withOpacity(.4), width: .4),
                ),
                color: Colors.white.withOpacity(.7),
                // image: DecorationImage(
                //   image: AssetImage(AppImage.bgNav),
                //   fit: BoxFit.cover,
                // ),
              ),
              child: NavigationBarTheme(
                data: NavigationBarThemeData(
                  iconTheme: WidgetStateProperty.resolveWith((states) {
                    if (states.contains(WidgetState.selected)) {
                      return const IconThemeData(
                        color: AppColor.buttonprimaryCol
                      );
                    }
                    return const IconThemeData(color: Color(0xff6C757D));
                  }),
                  labelTextStyle: WidgetStateProperty.resolveWith((states) {
                    if (states.contains(WidgetState.selected)) {
                      return const TextStyle(
                        color: AppColor.buttonprimaryCol,
                        fontSize: 10,
                      );
                    }
                    return const TextStyle(
                      color: Color(0xff6C757D),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    );
                  }),
                ),
                child: NavigationBar(
                  labelPadding: EdgeInsets.zero,
                  backgroundColor: Colors.transparent,
                  surfaceTintColor: Colors.transparent,
                  overlayColor: WidgetStatePropertyAll(Colors.transparent),
                  indicatorColor: Colors.transparent,
                  selectedIndex: _index,
                  onDestinationSelected: (i) => setState(() => _index = i),
                  destinations: [
                    const NavigationDestination(
                      icon: Icon(Iconsax.home_copy),
                      selectedIcon: Icon(Iconsax.home_1),
                      label: 'Trang chủ',
                    ),
                    const NavigationDestination(
                      icon: Icon(Iconsax.discount_shape_copy),
                      selectedIcon: Icon(Iconsax.discount_shape),
                      label: 'Khuyến mãi',
                    ),
                    NavigationDestination(
                      icon: _NavIconWithBadge(
                        icon: Iconsax.notification_copy,
                        count: unread,
                      ),
                      selectedIcon: _NavIconWithBadge(
                        icon: Iconsax.notification,
                        count: unread,
                      ),
                      label: 'Thông báo',
                    ),
                    const NavigationDestination(
                      icon: Icon(Iconsax.user_copy),
                      selectedIcon: Icon(Iconsax.user),
                      label: 'Tài khoản',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavIconWithBadge extends StatelessWidget {
  const _NavIconWithBadge({required this.icon, required this.count});

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    if (count <= 0) {
      return Icon(icon);
    }

    final display = count > 99 ? '99+' : '$count';

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        Positioned(
          right: -6,
          top: -4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            decoration: BoxDecoration(
              color: Colors.red,
              borderRadius: BorderRadius.circular(999),
            ),
            constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
            child: Text(
              display,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 9,
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
