import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/address/data/repository/address_repository.dart';
import 'package:frontend_mobile/features/auth/data/models/user_model.dart';
import 'package:frontend_mobile/features/cart/data/repository/cart_repository.dart';
import 'package:frontend_mobile/features/cart/presentation/viewmodels/cart_controller.dart';
import 'package:frontend_mobile/features/cart/presentation/viewmodels/cart_state.dart';
import 'package:frontend_mobile/features/chat/data/repo/bot_chat_repository.dart';
import 'package:frontend_mobile/features/chat/presentation/viewmodel/bot_chat_controller.dart';
import 'package:frontend_mobile/features/chat/presentation/viewmodel/bot_chat_state.dart';
import 'package:frontend_mobile/features/checkout/data/repository/checkout_repository.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_controller.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';
import 'package:frontend_mobile/features/coupon/data/repository/coupon_repository.dart';
import 'package:frontend_mobile/features/coupon/presentation/viewmodels/user_coupon_controller.dart';
import 'package:frontend_mobile/features/coupon/presentation/viewmodels/user_coupon_state.dart';
import 'package:frontend_mobile/features/coupon_center/data/repository/coupon_center_repository.dart';
import 'package:frontend_mobile/features/coupon_center/presentation/viewmodel/coupon_center_controller.dart';
import 'package:frontend_mobile/features/coupon_center/presentation/viewmodel/coupon_center_state.dart';
import 'package:frontend_mobile/features/home/data/repository/catalog_repository.dart';
import 'package:frontend_mobile/features/home/presentation/viewmodels/catalog_controller.dart';
import 'package:frontend_mobile/features/home/presentation/viewmodels/catalog_state.dart';
import 'package:frontend_mobile/features/notifications/data/repository/user_notification_repository.dart';
import 'package:frontend_mobile/features/notifications/presentation/viewmodels/user_notification_controller.dart';
import 'package:frontend_mobile/features/notifications/presentation/viewmodels/user_notification_state.dart';
import 'package:frontend_mobile/features/order/data/repository/order_repository.dart';
import 'package:frontend_mobile/features/order/presentation/viewmodels/orders_controller.dart';
import 'package:frontend_mobile/features/order/presentation/viewmodels/orders_state.dart';
import 'package:frontend_mobile/features/product_detail/data/repository/product_detail_repository.dart';
import 'package:frontend_mobile/features/profile/data/repository/profile_repository.dart';
import 'package:frontend_mobile/features/profile/presentation/viewmodels/profile_controller.dart';
import 'package:frontend_mobile/features/review/data/repository/review_repository.dart';
import 'package:frontend_mobile/features/review/presentation/viewmodel/product_reviews_controller.dart';
import 'package:frontend_mobile/features/review/presentation/viewmodel/review_state.dart';
import 'package:frontend_mobile/features/search/data/repository/search_repository.dart';
import 'package:frontend_mobile/features/search/data/repository/search_result_repository.dart';
import 'package:frontend_mobile/features/search/presentation/viewmodel/search_result_controller.dart';
import 'package:frontend_mobile/features/search/presentation/viewmodel/search_result_state.dart';
import 'package:frontend_mobile/features/search/presentation/viewmodel/search_state.dart';
import '../../features/profile/presentation/viewmodels/profile_state.dart';
import '../network/dio_config.dart';
import '../network/token_storage.dart';
import '../../features/auth/data/repositories/auth_repository.dart';
import '../../features/auth/presentation/viewmodels/auth_controller.dart';

final dioClientProvider = Provider<DioClient>((ref) {
  throw UnimplementedError('dioClientProvider chưa được override');
});

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  throw UnimplementedError('tokenStorageProvider chưa được override');
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  final tokenStorage = ref.read(tokenStorageProvider);

  return AuthRepository(dioClient: dioClient, tokenStorage: tokenStorage);
});

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<UserModel?>>(
      (ref) => AuthController(ref),
    );

////CATALOG
final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return CatalogRepository(dioClient: dioClient);
});

// CatalogController (state global cho home/catalog)
final catalogControllerProvider =
    StateNotifierProvider<CatalogController, CatalogState>((ref) {
      final repo = ref.read(catalogRepositoryProvider);
      return CatalogController(repo);
    });

final productDetailRepositoryProvider = Provider<ProductDetailRepository>((
  ref,
) {
  final dioClient = ref.read(dioClientProvider);
  return ProductDetailRepository(dioClient: dioClient);
});

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return CartRepository(dioClient: dioClient);
});

final cartControllerProvider =
    StateNotifierProvider.autoDispose<CartController, CartState>((ref) {
      final repo = ref.read(cartRepositoryProvider);
      return CartController(repo);
    });

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final dioClient = ref.read(dioClientProvider); // <-- dùng dioClientProvider
  return SearchRepository(
    dioClient: dioClient,
  ); // <-- truyền vào đúng tên param
});

final searchControllerProvider =
    StateNotifierProvider.autoDispose<SearchController, SearchState>((ref) {
      final repo = ref.watch(searchRepositoryProvider);
      return SearchController(repo);
    });

final searchResultRepositoryProvider = Provider<SearchResultRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return SearchResultRepository(dioClient);
});

final searchResultControllerProvider =
    StateNotifierProvider.autoDispose<
      SearchResultController,
      SearchResultState
    >((ref) {
      final repo = ref.read(searchResultRepositoryProvider);
      return SearchResultController(repo);
    });

final checkoutRepositoryProvider = Provider<CheckoutRepository>((ref) {
  final dio = ref.watch(dioClientProvider);
  return CheckoutRepository(dio);
});

final addressRepositoryProvider = Provider<AddressRepository>((ref) {
  final dio = ref.watch(dioClientProvider);
  return AddressRepository(dio);
});

final checkoutControllerProvider = StateNotifierProvider.autoDispose
    .family<CheckoutController, CheckoutState, CheckoutArgs>((ref, args) {
      final checkoutRepo = ref.read(checkoutRepositoryProvider);
      final addressRepo = ref.read(addressRepositoryProvider);

      return CheckoutController(
        checkoutRepo,
        addressRepo,
        cartItemIds: args.cartItemIds,
        directItem: args.directItem,
      );
    });

final couponRepositoryProvider = Provider<CouponRepository>((ref) {
  final dioClient = ref.watch(
    dioClientProvider,
  ); 
  return CouponRepository(dioClient);
});

final userCouponControllerProvider =
    StateNotifierProvider.family<UserCouponController, UserCouponState, int>((
      ref,
      subtotal,
    ) {
      final repo = ref.watch(couponRepositoryProvider);
      return UserCouponController(repo, subtotal: subtotal);
    });

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final dio = ref.read(dioClientProvider);
  return ProfileRepository(dioClient: dio);
});

final profileControllerProvider =
    StateNotifierProvider<ProfileController, ProfileState>((ref) {
      final repo = ref.read(profileRepositoryProvider);
      return ProfileController(repo);
    });

// ORDERS
final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  final dio = ref.read(dioClientProvider);
  return OrderRepository(dio);
});

final ordersControllerProvider =
    StateNotifierProvider<OrdersController, OrdersState>((ref) {
      final repo = ref.read(orderRepositoryProvider);
      return OrdersController(repo);
    });

// repository
final couponCenterRepositoryProvider = Provider<CouponCenterRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return CouponCenterRepository(dioClient: dioClient);
});

// controller
final couponCenterControllerProvider =
    StateNotifierProvider.autoDispose<
      CouponCenterController,
      CouponCenterState
    >((ref) {
      final repo = ref.read(couponCenterRepositoryProvider);
      final c = CouponCenterController(repo);
      c.loadCouponsAndPromotions();
      return c;
    });

final userNotificationRepositoryProvider = Provider<UserNotificationRepository>(
  (ref) => UserNotificationRepository(dioClient: ref.read(dioClientProvider)),
);

final userNotificationControllerProvider =
    StateNotifierProvider.autoDispose<
      UserNotificationController,
      UserNotificationState
    >(
      (ref) => UserNotificationController(
        ref.read(userNotificationRepositoryProvider),
      ),
    );

// repo
final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  final dioClient = ref.watch(
    dioClientProvider,
  ); // <-- dùng dioClientProvider, không phải dioProvider
  return ReviewRepository(dioClient: dioClient);
});

// controller theo productId
final productReviewsControllerProvider = StateNotifierProvider.autoDispose
    .family<ProductReviewsController, ProductReviewsState, String>((
      ref,
      productId,
    ) {
      final repo = ref.watch(reviewRepositoryProvider);
      return ProductReviewsController(
        repo: repo,
        ref: ref,
        productId: productId,
      );
    });

final botChatRepositoryProvider = Provider<BotChatRepository>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return BotChatRepository(dioClient: dioClient);
});

final botChatControllerProvider =
    StateNotifierProvider<BotChatController, BotChatState>((ref) {
      final repo = ref.read(botChatRepositoryProvider);
      return BotChatController(repo);
    });
