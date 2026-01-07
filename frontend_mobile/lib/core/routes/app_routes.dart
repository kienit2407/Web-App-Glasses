import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:go_router/go_router.dart';

import 'package:frontend_mobile/core/routes/bottom_navigation_bar.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/auth/presentation/views/signin_page.dart';
import 'package:frontend_mobile/features/auth/presentation/views/signup_page.dart';
import 'package:frontend_mobile/features/auth/presentation/views/splash_page.dart';
import 'package:frontend_mobile/features/cart/presentation/views/cart_page.dart';
import 'package:frontend_mobile/features/chat/presentation/views/bot_chat_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/address_form_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/address_select_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/payment_result_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/vnpay_webview_page.dart';
import 'package:frontend_mobile/features/order/presentation/views/order_detail_page.dart';
import 'package:frontend_mobile/features/order/presentation/views/orders_page.dart';
import 'package:frontend_mobile/features/product_detail/presentation/views/product_detail_page.dart';
import 'package:frontend_mobile/features/profile/presentation/view/change_password_page.dart';
import 'package:frontend_mobile/features/profile/presentation/view/edit_profile_page.dart';
import 'package:frontend_mobile/features/profile/presentation/view/my_coupons_page.dart';
import 'package:frontend_mobile/features/search/presentation/view/search_page.dart';
import 'package:frontend_mobile/features/search/presentation/view/search_result_page.dart';

class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String home = '/home';
  static const String farmers = '/farmers';
  static const String farmerDetail = '/farmers/:id';
  // Thêm routes khác ở đây...
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // tạo 1 provider cung cấp router cho app
  final authState = ref.watch(authControllerProvider.notifier).isLoggedIn;

  // tạo router 1 lần
  final router = GoRouter(
    initialLocation: '/', // Splash
    redirect: (context, state) {
      final currentPath = state.matchedLocation;
      // Routes cần đăng nhập (guard)
      final protectedRoutes = ['/checkout', '/settings'];

      if (protectedRoutes.contains(currentPath) && !authState) {
        // GUARD: Chặn và redirect về login
        return '/login?redirect=$currentPath'; // Lưu path để quay lại sau
      }

      // Đã login mà vào /login → không cần, về home
      if (currentPath == '/login' && authState) {
        return '/home';
      }

      return null; // Cho qua
    },
    routes: [
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/signin',
        name: 'signin',
        builder: (context, state) => const SigninPage(),
      ),
      GoRoute(
        path: '/signup',
        name: 'signup',
        builder: (context, state) => const SignupPage(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const MainShell(),
      ),

      GoRoute(
        path: '/product/:id',
        name: 'product-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProductDetailPage(productId: id);
        },
      ),

      GoRoute(
        path: '/cart',
        name: 'cart',
        builder: (context, state) => const CartPage(),
      ),
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) => const SearchPage(),
      ),
      GoRoute(
        name: 'search-result',
        path: '/search-result',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;

          final query = extra?['query'] as String? ?? '';
          final gender = extra?['gender'] as String?;
          final shape = extra?['shape'] as String?;
          final type = extra?['type'] as String?;
          final brandId = extra?['brandId'] as String?;

          return SearchResultPage(
            initialQuery: query,
            initialGender: gender,
            initialShape: shape,
            initialType: type,
            initialBrandId: brandId,
          );
        },
      ),

      // Checkout: nếu thiếu args thì redirect về cart (tránh crash deeplink)
      GoRoute(
        path: '/checkout',
        name: 'checkout',
        redirect: (context, state) =>
            state.extra is CheckoutArgs ? null : '/cart',
        builder: (context, state) {
          final extra = state.extra as CheckoutArgs;
          return CheckoutPage(args: extra);
        },
      ),

      GoRoute(
        path: '/vnpay-webview',
        name: 'vnpay-webview',
        redirect: (context, state) => state.extra is VnpayArgs ? null : '/home',
        builder: (context, state) {
          final args = state.extra as VnpayArgs;
          return VnpayWebviewPage(args: args);
        },
      ),

      GoRoute(
        path: '/payment-result',
        name: 'payment-result',
        redirect: (context, state) =>
            state.extra is PaymentResultArgs ? null : '/home',
        builder: (context, state) {
          final args = state.extra as PaymentResultArgs;
          return PaymentResultPage(args: args);
        },
      ),

      GoRoute(
        name: 'address-select',
        path: '/checkout/address-select',
        builder: (context, state) =>
            const AddressSelectPage(returnSelectedAddress: true),
      ),
      GoRoute(
        path: '/address-form',
        name: 'address-form',
        builder: (context, state) {
          final existing = state.extra as Address?;
          return AddressFormPage(existing: existing);
        },
      ),

      GoRoute(
        path: '/orders',
        name: 'orders',
        builder: (context, state) => const OrdersPage(),
      ),
      GoRoute(
        path: '/orders/:id',
        name: 'order-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return OrderDetailPage(orderId: id);
        },
      ),

      GoRoute(
        name: 'my-addresses',
        path: '/account/addresses',
        builder: (context, state) =>
            const AddressSelectPage(returnSelectedAddress: false),
      ),
      GoRoute(
        path: '/my-coupons',
        name: 'my-coupons',
        builder: (context, state) => const MyCouponsPage(),
      ),
      GoRoute(
        name: 'account-settings',
        path: '/account-settings',
        builder: (context, state) => const EditProfilePage(),
      ),
      GoRoute(
        name: 'change-password',
        path: '/change-password',
        builder: (context, state) => const ChangePasswordPage(),
      ),
      GoRoute(
        path: '/ai-chat',
        name: 'ai-chat',
        builder: (context, state) => const BotChatPage(),
      ),
    ],
  );
  return router;
});
