import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/utils/auth_session_provider.dart';
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


bool _isPublicLocation(String loc) {
  // Public như Shopee: khách vẫn xem được
  if (loc == '/' ||
      loc == '/home' ||
      loc == '/signin' ||
      loc == '/signup' ||
      loc == '/search' ||
      loc == '/search-result' ||
      loc == '/cart' ||
      loc == '/ai-chat') return true;

  if (loc.startsWith('/product/')) return true;

  return false;
}

bool _isProtectedLocation(String loc) {
  // Những trang nên yêu cầu login
  if (loc == '/checkout' || loc.startsWith('/checkout/')) return true;
  if (loc == '/orders' || loc.startsWith('/orders/')) return true;
  if (loc == '/my-coupons') return true;
  if (loc == '/account-settings') return true;
  if (loc == '/change-password') return true;
  if (loc == '/account/addresses') return true;
  if (loc == '/address-form') return true;
  if (loc == '/vnpay-webview') return true;
  if (loc == '/payment-result') return true;

  return false;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // tạo router 1 lần
  final router = GoRouter(
    initialLocation: '/', // Splash
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isLoggedIn = ref.read(isLoggedInProvider);

      // Splash/public không chặn
      if (_isPublicLocation(loc)) return null;

      // Nếu là protected mà chưa login => đá về signin + giữ đường dẫn để quay lại
      if (!isLoggedIn && _isProtectedLocation(loc)) {
        final from = Uri.encodeComponent(state.uri.toString());
        return '/signin?from=$from';
      }

      return null;
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
        redirect: (context, state) =>
            state.extra is VnpayArgs ? null : '/home',
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

  // Quan trọng: auth state đổi thì router refresh để chạy lại redirect
  ref.listen<bool>(isLoggedInProvider, (_, __) => router.refresh());

  return router;
});
