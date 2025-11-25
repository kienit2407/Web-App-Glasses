// lib/core/routes/app_router.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/cart/presentation/views/cart_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/address_form_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/address_select_page.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_page.dart';
import 'package:frontend_mobile/features/product_detail/presentation/views/product_detail_page.dart';
import 'package:frontend_mobile/features/search/presentation/view/search_page.dart';
import 'package:frontend_mobile/features/search/presentation/view/search_result_page.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/viewmodels/auth_controller.dart';
import '../../features/auth/presentation/views/splash_page.dart';
import '../../features/auth/presentation/views/signin_page.dart';
import '../../features/home/presentation/views/home_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/', // Splash
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
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/product/:id',
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
      GoRoute(
        path: '/checkout',
        name: 'checkout',
        builder: (context, state) {
          final extra = state.extra as CheckoutArgs;
          return CheckoutPage(args: extra);
        },
      ),

      GoRoute(
        path: '/address-select',
        name: 'address-select',
        builder: (context, state) => const AddressSelectPage(),
      ),
      GoRoute(
        path: '/address-form',
        name: 'address-form',
        builder: (context, state) {
          final existing = state.extra as Address?;
          return AddressFormPage(existing: existing);
        },
      ),
    ],
  );
});
