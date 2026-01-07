import 'dart:async';

import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/routes/bottom_navigation_bar.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/home/data/models/banner_model.dart';
import 'package:frontend_mobile/features/home/data/models/brand_model.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';
import 'package:frontend_mobile/features/home/presentation/widgets/brand_section.dart';
import 'package:frontend_mobile/features/product_detail/presentation/views/product_detail_page.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:skeletonizer/skeletonizer.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final indexCarouselController = CarouselController();
  int currentIndex = 0;
  bool _isLoading = false;
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final auth = ref.read(authControllerProvider);
      final user = auth.valueOrNull;

      if (user != null) {
        ref.read(profileControllerProvider.notifier).loadProfile();
        ref.read(cartControllerProvider.notifier).loadCart();
      }
      ref.read(catalogControllerProvider.notifier).loadInitial();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(catalogControllerProvider);

    return Scaffold(
      appBar: AppBar(
        // Sử dụng AppColor.buttonprimaryCol làm background cho toàn bộ AppBar
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        // Dùng `title` để chứa thanh tìm kiếm và icon giỏ hàng
        // Và thiết lập chiều cao tùy chỉnh nếu cần thiết (optional)
        toolbarHeight: 60, // Tăng nhẹ chiều cao thanh công cụ nếu cần
        // Bỏ `flexibleSpace` và đưa nội dung vào `title`
        title: Padding(
          // Giữ padding từ trái và phải, loại bỏ padding trên/dưới không cần thiết
          padding: const EdgeInsets.only(top: 4, bottom: 4),
          child: Row(
            children: [
              // Thanh tìm kiếm (Expanded để chiếm hết không gian còn lại)
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    context.pushNamed('search');
                  },
                  child: Container(
                    height: 36,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(Icons.search, size: 18, color: Colors.grey),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: _SearchHintTyper(
                            hints: [
                              'Tìm kính mát nam',
                              'Kính cận chống ánh xanh',
                              'Kính mát nữ đi biển',
                              'Gọng titan bền bỉ',
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              const _CartIconButton(),
              IconButton(
                icon: const Icon(Iconsax.message_question_copy),
                onPressed: () => context.pushNamed('ai-chat'),
              ),
            ],
          ),
        ),
        automaticallyImplyLeading: false,
      ),
      backgroundColor: const Color(0xfff5f5f5),
      body: RefreshIndicator.adaptive(
        onRefresh: () => ref.read(catalogControllerProvider.notifier).refresh(),
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
            if (state.banners.isNotEmpty)
              SliverToBoxAdapter(child: _buildBannerCarousel(state.banners)),
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
            if (state.banners.isNotEmpty)
              SliverToBoxAdapter(
                child: _buildDotIndicator(state.banners)),
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
            // SliverPersistentHeader(delegate: delegate)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                child: Text(
                  'Thương hiệu chính hãng',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 13
                  ),
                ),
              ),
            ),
            if (state.brands.isNotEmpty)
              SliverToBoxAdapter(child: BrandSection(brands: state.brands)),
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                child: Text(
                  'Gợi ý hôm nay',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 13
                  ),
                ),
              ),
            ),
            if (state.isLoading && state.products.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator.adaptive()),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                sliver: SliverMasonryGrid.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  itemBuilder: (context, index) {
                    final product = state.products[index];
                    return _ProductCard(product: product);
                  },
                  childCount: state.products.length,
                ),
              ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Center(
                  child: state.hasMore
                      ? ElevatedButton(
                          onPressed: state.isLoadingMore
                              ? null
                              : () => ref
                                    .read(catalogControllerProvider.notifier)
                                    .loadMore(),
                          child: state.isLoadingMore
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Xem thêm', style: TextStyle(color: Colors.grey, fontSize: 12),),
                        )
                      : const Text(
                          'Bạn đã xem hết sản phẩm',
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                ),
              ),
            ),
            SliverPadding(padding: const EdgeInsets.only(bottom: 20)),
          ],
        ),
      ),
    );
  }

  // Widget _buildGuestAccount(BuildContext context) {
  //   return Scaffold(
  //     backgroundColor: const Color(0xfff5f5f5),
  //     appBar: AppBar(
  //       title: const Text('Tài khoản'),
  //       backgroundColor: AppColor.buttonprimaryCol,
  //       foregroundColor: Colors.white,
  //       centerTitle: true,
  //     ),
  //     body: Center(
  //       child: Padding(
  //         padding: const EdgeInsets.all(24),
  //         child: Column(
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             const Icon(Icons.person_outline, size: 80, color: Colors.grey),
  //             const SizedBox(height: 16),
  //             const Text(
  //               'Bạn chưa đăng nhập',
  //               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
  //             ),
  //             const SizedBox(height: 8),
  //             const Text(
  //               'Đăng nhập để xem đơn hàng, voucher và quản lý tài khoản.',
  //               textAlign: TextAlign.center,
  //               style: TextStyle(color: Colors.grey),
  //             ),
  //             const SizedBox(height: 24),
  //             SizedBox(
  //               width: double.infinity,
  //               child: ElevatedButton(
  //                 onPressed: () => context.goNamed('signin'),
  //                 style: ElevatedButton.styleFrom(
  //                   backgroundColor: AppColor.buttonprimaryCol,
  //                   foregroundColor: Colors.white,
  //                   padding: const EdgeInsets.symmetric(vertical: 12),
  //                 ),
  //                 child: const Text('Đăng nhập'),
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             SizedBox(
  //               width: double.infinity,
  //               child: OutlinedButton(
  //                 onPressed: () => context.goNamed('signup'),
  //                 child: const Text('Đăng ký'),
  //               ),
  //             ),
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }

  Widget _buildDotIndicator(List<BannerModel> banners) {
    // Đổi kiểu dữ liệu phù hợp
    final itemCount = banners.length; // Số lượng item

    return Skeletonizer(
      enabled: _isLoading,
      child: Center( // nền có align hoặc center đẻ loai bỏ ràng buộc width của lớp cha
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black12,
            borderRadius: BorderRadius.circular(50)
          ),
          padding: const EdgeInsets.all(5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            // Dùng wrap/padding để tạo khoảng cách giữa các chấm thay vì `spacing` (không tồn tại trong Row)
            children: List.generate(itemCount, (index) {
              bool isSelected = currentIndex == index;
              return GestureDetector(
                onTap: () {
                  // Sử dụng CarouselController đã được gắn với CarouselSlider
                  // Nếu chưa có, bạn cần khai báo và truyền vào CarouselSlider
                  // indexCarouselController.jumpToPage(index);
                  // indexCarouselController.animateToPage(index, duration: const Duration(milliseconds: 300));
                },
                child: Padding(
                  // Thêm Padding để tạo khoảng cách giữa các chấm
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: AnimatedContainer(
                    curve: Curves.easeInOut,
                    duration: const Duration(milliseconds: 300),
                    // Kích thước của chấm (Chấm đang chọn sẽ lớn hơn)
                    width: isSelected ? 20 : 8,
                    height:
                        8, // Chiều cao cố định (thường là hình chữ nhật hoặc tròn)
                    decoration: BoxDecoration(
                      // Thay thế Image bằng màu sắc
                      color: isSelected ? AppColor.buttonprimaryCol : Colors.white,
                      // Làm tròn góc (hình viên thuốc nếu là hình chữ nhật)
                      borderRadius: isSelected
                          ? BorderRadius.circular(5)
                          : BorderRadius.circular(4),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildBannerCarousel(List<BannerModel> banners) {
    // 1. Nếu không có banner, không hiển thị gì cả
    if (banners.isEmpty) {
      return const SizedBox.shrink();
    }

    // 2. Sử dụng CarouselSlider.builder
    return CarouselSlider.builder(
      // options: Thiết lập các tùy chọn cho carousel
      options: CarouselOptions(
        onPageChanged: (index, reason) {
          setState(() {
            currentIndex = index; // Cập nhật currentIndex khi trang thay đổi
          });
        },
        // Chiều cao cố định (giống như 150 trước đây)
        height: 150.0,
        // Tự động chạy (autoplay)
        autoPlay: true,
        // Thời gian chờ giữa các lần chạy tự động (ví dụ: 4 giây)
        autoPlayInterval: const Duration(seconds: 4),
        // Tạo khoảng cách giữa các item (viewportFraction: 0.92)
        viewportFraction: 0.92,
        // Tạo hiệu ứng phóng to item ở trung tâm
        enlargeCenterPage: true,
        // Điều chỉnh tốc độ tự động chạy
        autoPlayCurve: Curves.fastOutSlowIn,
        // Kích hoạt lặp vô hạn (rất quan trọng cho autoplay)
        enableInfiniteScroll: true,
      ),
      // item count: Số lượng banner
      itemCount: banners.length,
      // item builder: Cách xây dựng từng banner item
      itemBuilder: (BuildContext context, int index, int realIndex) {
        final b = banners[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            // Sử dụng Image.network để hiển thị banner
            child: Image.network(b.imageUrl, fit: BoxFit.cover),
          ),
        );
      },
    );
  }

  Widget _buildBrandStrip(List<BrandModel> brands) {
    return SizedBox(
      height: 100,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final brand = brands[index];
          return GestureDetector(
            onTap: () {
              context.pushNamed(
                'search-result',
                extra: {
                  'query': '', // không filter q
                  'gender': null,
                  'shape': null,
                  'type': null, // nếu muốn cố định "gọng kính" thì để 'frame'
                  'brandId': brand.id,
                },
              );
            },

            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: brand.logoUrl != null && brand.logoUrl!.isNotEmpty
                        ? Image.network(brand.logoUrl!, fit: BoxFit.contain)
                        : Center(
                            child: Text(
                              brand.name.isNotEmpty
                                  ? brand.name[0].toUpperCase()
                                  : 'B',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: 70,
                  child: Text(
                    brand.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CartIconButton extends ConsumerWidget {
  const _CartIconButton({super.key});

  String _formatBadge(int qty) {
    if (qty > 99) return '99+';
    return qty.toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartControllerProvider);
    final totalQty = cartState.cart?.totalQuantity ?? 0;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: () {
            // đi tới trang giỏ hàng
            context.push('/cart');
          },
          icon: const Icon(
            Icons.shopping_cart_outlined,
            color: Colors.white,
            size: 24,
          ),
        ),
        if (totalQty > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: const BoxDecoration(
                color: Colors.redAccent,
                shape: BoxShape.rectangle,
                borderRadius: BorderRadius.all(Radius.circular(10)),
              ),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              child: Text(
                _formatBadge(totalQty),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final ProductListItem product;

  String _formatPrice(int price) {
    return '${price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  @override
  Widget build(BuildContext context) {
    final currentPriceText = _formatPrice(product.price);
    final originalPriceText = product.hasDiscount
        ? _formatPrice(product.originalPrice)
        : null;

    return GestureDetector(
      onTap: () {
        context.push('/product/${product.productId}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          mainAxisSize: MainAxisSize.min, // <-- cho nó cao theo nội dung
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ====== Logo brand (giống web: strip trên) ======
            if (product.brandLogoUrl != null || product.brandName != null)
              Container(
                height: 50,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                alignment: Alignment.bottomCenter,
                child:
                    product.brandLogoUrl != null &&
                        product.brandLogoUrl!.isNotEmpty
                    ? Image.network(
                        product.brandLogoUrl!,
                        height: 50,
                        fit: BoxFit.contain,
                      )
                    : Text(
                        product.brandName ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey,
                        ),
                      ),
              ),

            // ====== Ảnh + badge giảm giá / sắp hết ======
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Image.network(product.thumbnailUrl, fit: BoxFit.cover),
                ),

                // badge -% góc trái trên
                if (product.hasDiscount)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '-${product.discountPercent}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                // badge sắp hết hàng
                if (product.totalStock < 10)
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Còn ${product.totalStock}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // ====== Tên sản phẩm ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 2),
              child: Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11),
              ),
            ),

            // ====== Giá (gốc gạch + giá hiện tại) ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 2),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (originalPriceText != null) const SizedBox(width: 4),
                  Text(
                    currentPriceText,
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  if (originalPriceText != null)
                    Text(
                      originalPriceText,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                ],
              ),
            ),

            // ====== Rating + đã bán ======
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
              child: Row(
                children: [
                  const Icon(Icons.star, color: Colors.orange, size: 12),
                  const SizedBox(width: 2),
                  Text(
                    product.ratingAvg.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 11),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '(${product.reviewCount})',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Đã bán ${product.selledAmount}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchHintTyper extends StatefulWidget {
  const _SearchHintTyper({
    required this.hints,
    this.textStyle,
    this.typingSpeed = const Duration(milliseconds: 120),
    this.pauseDuration = const Duration(milliseconds: 1200),
  });

  final List<String> hints;
  final TextStyle? textStyle;
  final Duration typingSpeed;
  final Duration pauseDuration;

  @override
  State<_SearchHintTyper> createState() => _SearchHintTyperState();
}

class _SearchHintTyperState extends State<_SearchHintTyper> {
  late String _currentHint;
  int _hintIndex = 0;
  int _charIndex = 0;
  bool _isDeleting = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _currentHint = widget.hints[_hintIndex];
    _startTyping();
  }

  void _startTyping() {
    _timer?.cancel();
    _timer = Timer.periodic(widget.typingSpeed, (timer) {
      setState(() {
        if (!_isDeleting) {
          // Đang gõ
          if (_charIndex < _currentHint.length) {
            _charIndex++;
          } else {
            // Gõ xong -> pause rồi bắt đầu xoá
            _isDeleting = true;
            _timer?.cancel();
            _timer = Timer(widget.pauseDuration, _startTyping);
          }
        } else {
          // Đang xoá
          if (_charIndex > 0) {
            _charIndex--;
          } else {
            // Xoá xong -> chuyển sang hint tiếp theo
            _isDeleting = false;
            _hintIndex = (_hintIndex + 1) % widget.hints.length;
            _currentHint = widget.hints[_hintIndex];
            _timer?.cancel();
            _timer = Timer(const Duration(milliseconds: 300), _startTyping);
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = _currentHint.substring(0, _charIndex);
    return Text(
      text.isEmpty ? 'Tìm kiếm' : text, // fallback khi mới vào
      style:
          widget.textStyle ??
          const TextStyle(
            color: AppColor.buttomThirdCol,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
      overflow: TextOverflow.ellipsis,
    );
  }
}
