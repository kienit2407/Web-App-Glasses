// main_shell.dart
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/home/presentation/views/home_page.dart';
import 'package:frontend_mobile/features/profile/presentation/view/account_home_page.dart';
import 'package:iconsax/iconsax.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  final _pages = const [
    HomePage(), // bạn bỏ phần bottomNav trong HomePage đi
    Placeholder(), // sau này thay bằng PromotionsPage()
    Placeholder(), // NotificationsPage()
    AccountHomePage(), // AccountPage()
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // dùng IndexedStack để giữ state từng tab
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: Transform.translate(
        offset: const Offset(0, 20),
        child: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: AssetImage(AppImage.bgNav),
              fit: BoxFit.cover,
            ),
          ),
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              iconTheme: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const IconThemeData(color: Colors.white);
                }
                return const IconThemeData(color: Colors.white70);
              }),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  );
                }
                return const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                );
              }),
            ),
            child: NavigationBar(
              backgroundColor: Colors.transparent,
              surfaceTintColor: Colors.transparent,
              indicatorColor: AppColor.buttonprimaryCol.withOpacity(0.2),
              selectedIndex: _index,
              onDestinationSelected: (i) => setState(() => _index = i),
              destinations: const [
                NavigationDestination(
                  icon: Icon(Iconsax.home),
                  selectedIcon: Icon(Iconsax.home_15),
                  label: 'Trang chủ',
                ),
                NavigationDestination(
                  icon: Icon(Iconsax.discount_shape),
                  selectedIcon: Icon(Iconsax.discount_shape1),
                  label: 'Khuyến mãi',
                ),
                NavigationDestination(
                  icon: Icon(Iconsax.notification),
                  selectedIcon: Icon(Iconsax.notification5),
                  label: 'Thông báo',
                ),
                NavigationDestination(
                  icon: Icon(Iconsax.user),
                  label: 'Tài khoản',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
