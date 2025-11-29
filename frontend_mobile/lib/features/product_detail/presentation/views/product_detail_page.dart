import 'dart:io';
import 'dart:ui' show lerpDouble;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/common/cart_icon_button.dart';
import 'package:frontend_mobile/core/di/providers.dart'
    show
        productDetailRepositoryProvider,
        cartControllerProvider,
        authControllerProvider,
        productReviewsControllerProvider;
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/product_detail/data/model/product_detail_model.dart';
import 'package:frontend_mobile/features/review/data/model/review_model.dart';
import 'package:frontend_mobile/features/review/presentation/viewmodel/product_reviews_controller.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class ProductDetailPage extends ConsumerStatefulWidget {
  const ProductDetailPage({super.key, required this.productId});

  final String productId; // chỉ dùng id, không cần slug cho mobile

  @override
  ConsumerState<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends ConsumerState<ProductDetailPage>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  ProductDetail? _detail;

  String? _selectedVariantId;
  String? _activeImageUrl;
  int _quantity = 1;
  late final PageController _pageController;
  late final TabController _tabController;
  // cho hiệu ứng thêm giỏ hàng
  final GlobalKey _imageKey = GlobalKey();
  final GlobalKey _cartIconKey = GlobalKey();
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _tabController = TabController(length: 3, vsync: this);
    _loadDetail();
  }

  Future<void> _runAddToCartAnimation() async {
    // nếu đang animate rồi thì thôi, tránh spam tạo nhiều controller
    bool isAnimating = false;
    if (isAnimating) return;
    isAnimating = true;

    final overlay = Overlay.of(context);

    // box của ảnh và icon giỏ
    final imageBox = _imageKey.currentContext?.findRenderObject() as RenderBox?;
    final cartBox =
        _cartIconKey.currentContext?.findRenderObject() as RenderBox?;

    if (imageBox == null || cartBox == null) {
      isAnimating = false;
      return;
    }

    final imageCenter = imageBox.localToGlobal(
      imageBox.size.center(Offset.zero),
    );
    final cartCenter = cartBox.localToGlobal(cartBox.size.center(Offset.zero));

    // URL ảnh sẽ bay
    final imageUrl = _activeImageUrl ?? _detail?.product.thumbnailUrl ?? '';
    if (imageUrl.isEmpty) {
      isAnimating = false;
      return;
    }

    final controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    final animation = CurvedAnimation(
      parent: controller,
      curve: Curves.easeInOut,
    );

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) {
        final t = animation.value;

        final dx = lerpDouble(imageCenter.dx, cartCenter.dx, t)!;
        final dy = lerpDouble(imageCenter.dy, cartCenter.dy, t)!;

        final size = lerpDouble(60, 24, t)!; // thu nhỏ dần
        final opacity = 1 - t;

        return Positioned(
          top: dy - size / 2,
          left: dx - size / 2,
          child: IgnorePointer(
            child: Opacity(
              opacity: opacity,
              child: Image.network(imageUrl, width: size, height: size),
            ),
          ),
        );
      },
    );

    overlay.insert(entry);

    // 👉 Quan trọng: mỗi tick animation, rebuild OverlayEntry
    controller.addListener(() {
      if (entry.mounted) {
        entry.markNeedsBuild();
      }
    });

    await controller.forward();

    entry.remove();
    controller.dispose();
    isAnimating = false;
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(productDetailRepositoryProvider);
      final detail = await repo.fetchDetail(widget.productId);

      String? selectedVariantId;
      String? activeImage;

      if (detail.variants.isNotEmpty) {
        selectedVariantId = detail.variants.first.variantId;
        final firstVariantId = selectedVariantId;

        final variantImgs = detail.imagesByVariant[firstVariantId] ?? [];
        final allImgs = [...variantImgs, ...detail.productImages];

        if (allImgs.isNotEmpty) {
          activeImage = allImgs.first.url;
        } else if (detail.product.thumbnailUrl != null) {
          activeImage = detail.product.thumbnailUrl;
        }
      } else if (detail.product.thumbnailUrl != null) {
        activeImage = detail.product.thumbnailUrl;
      }

      setState(() {
        _detail = detail;
        _selectedVariantId = selectedVariantId;
        _activeImageUrl = activeImage;
        _isLoading = false;
      });
    } catch (e) {
      // TODO: show SnackBar
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  VariantModel? get _selectedVariant {
    if (_detail == null || _selectedVariantId == null) return null;
    for (final v in _detail!.variants) {
      if (v.variantId == _selectedVariantId) return v;
    }
    return null;
  }

  List<DetailImage> get _galleryImages {
    if (_detail == null) return [];

    final Map<String, List<DetailImage>> byVariant = _detail!.imagesByVariant;
    final List<DetailImage> productImgs = _detail!.productImages;

    final List<DetailImage> variantImgs = _selectedVariantId != null
        ? (byVariant[_selectedVariantId] ?? <DetailImage>[])
        : <DetailImage>[];

    final List<DetailImage> all = [...variantImgs, ...productImgs];

    if (all.isEmpty && _detail!.product.thumbnailUrl != null) {
      return <DetailImage>[
        DetailImage(
          imageId: 'thumb',
          url: _detail!.product.thumbnailUrl!,
          urlId: '',
          position: 0,
        ),
      ];
    }

    return all;
  }

  String _formatPrice(int price) {
    final str = price.toString();
    final reg = RegExp(r'\B(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (m) => '.') + 'đ';
  }

  @override
  Widget build(BuildContext context) {
    final detail = _detail;
    final cartController = ref.read(cartControllerProvider.notifier);
    final authState = ref.watch(authControllerProvider);
    final isLoggedIn = authState.valueOrNull != null;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết sản phẩm')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (detail == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết sản phẩm')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Không tìm thấy sản phẩm'),
              const SizedBox(height: 8),
              TextButton(onPressed: _loadDetail, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }

    final product = detail.product;
    final variant = _selectedVariant;
    final rating = product.ratingAvg;
    final stock = variant?.stock ?? 0;

    final displayPrice =
        (variant?.salePrice != null &&
            variant!.salePrice! > 0 &&
            variant.salePrice! < variant.price)
        ? variant.salePrice!
        : (variant?.price ?? 0);

    final originPrice = variant?.price ?? 0;
    final hasDiscount =
        (variant?.salePrice != null &&
        variant!.salePrice! > 0 &&
        variant.salePrice! < originPrice);

    final discountPercent = hasDiscount
        ? ((originPrice - (variant!.salePrice ?? 0)) * 100 ~/ originPrice)
        : 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          // gán key để tính vị trí đích
          CartIconButton(key: _cartIconKey),
        ],
        backgroundColor: Colors.white,
        shadowColor: Colors.black,
        foregroundColor: Colors.black87,
        elevation: 0.5,
      ),
      backgroundColor: const Color(0xfff5f5f5),

      body: RefreshIndicator(
        onRefresh: _loadDetail,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ===== GALLERY (full width, giống Shopee) =====
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: _buildGallerySection(),
              ),

              const SizedBox(height: 8),

              // ===== INFO (tên, rating, giá, biến thể) =====
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                child: _buildInfoSection(
                  product: product,
                  variant: variant,
                  displayPrice: displayPrice,
                  originPrice: originPrice,
                  hasDiscount: hasDiscount,
                  discountPercent: discountPercent,
                  rating: rating,
                  stock: stock,
                ),
              ),

              const SizedBox(height: 8),

              // ===== TABS: Mô tả / Thông số / Đánh giá =====
              Container(
                color: Colors.white,
                child: Column(
                  children: [
                    TabBar(
                      controller: _tabController,
                      labelColor: AppColor.buttonprimaryCol,
                      unselectedLabelColor: Colors.black54,
                      indicatorColor: AppColor.buttonprimaryCol,
                      tabs: const [
                        Tab(text: 'Mô tả'),
                        Tab(text: 'Thông số'),
                        Tab(text: 'Đánh giá'),
                      ],
                    ),
                    // Cho height cố định để TabBarView không bị lỗi trong ScrollView
                    SizedBox(
                      height: 380,
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildDescriptionTab(product),
                          _buildSpecsTab(product, variant),
                          _buildReviewsTab(product),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),

      // ===== BOTTOM BAR: số lượng + Thêm giỏ + Mua ngay (kiểu Shopee) =====
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              // nút +/- số lượng
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 18),
                      onPressed: () {
                        setState(() {
                          _quantity = _quantity > 1 ? _quantity - 1 : 1;
                        });
                      },
                    ),
                    Text(
                      '$_quantity',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add, size: 18),
                      onPressed: () {
                        setState(() {
                          final maxQty = stock > 0 ? stock : 99;
                          if (_quantity < maxQty) _quantity++;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Thêm vào giỏ
              Expanded(
                child: ElevatedButton(
                  onPressed: variant == null || stock <= 0
                      ? null
                      : () async {
                          // 1. Nếu chưa login -> đi signin
                          if (!isLoggedIn) {
                            context.goNamed('signin');
                            return;
                          }
                          try {
                            await cartController.addToCart(
                              variant.variantId,
                              _quantity,
                            );

                            // hiệu ứng bay vào giỏ 👇
                            _runAddToCartAnimation();

                            // SnackBar thông báo (nếu muốn giữ)
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text(
                                  'Đã thêm sản phẩm vào giỏ hàng',
                                ),
                                behavior: SnackBarBehavior.floating,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          } catch (_) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Không thêm được sản phẩm vào giỏ',
                                ),
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColor.buttonprimaryCol,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Mua ngay
              Expanded(
                child: OutlinedButton(
                  onPressed: (variant == null || stock <= 0)
                      ? null
                      : () {
                          if (!isLoggedIn) {
                            context.goNamed('signin');
                            return;
                          }
                          context.pushNamed(
                            'checkout',
                            extra: CheckoutArgs.direct(
                              variantId: variant.variantId,
                              quantity: _quantity,
                            ),
                          );
                        },
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppColor.buttonprimaryCol),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    'Mua ngay',
                    style: TextStyle(color: AppColor.buttonprimaryCol),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ========== WIDGET CON ==========

  Widget _buildGallerySection() {
    final images = _galleryImages;

    return Column(
      children: [
        AspectRatio(
          key: _imageKey,
          aspectRatio: 1,
          child: PageView.builder(
            controller: _pageController,
            itemCount: images.length,
            onPageChanged: (index) {
              setState(() {
                _activeImageUrl = images[index].url;
              });
            },
            itemBuilder: (context, index) {
              final img = images[index];
              return ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(img.url, fit: BoxFit.cover),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        if (images.length > 1)
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, index) {
                final img = images[index];
                final isSelected = _activeImageUrl == img.url;
                return GestureDetector(
                  onTap: () {
                    _pageController.animateToPage(
                      index,
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                    );
                    setState(() => _activeImageUrl = img.url);
                  },
                  child: Container(
                    width: 60,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSelected
                            ? AppColor.buttonprimaryCol
                            : Colors.grey.shade300,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(img.url, fit: BoxFit.cover),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildInfoSection({
    required ProductInfo product,
    required VariantModel? variant,
    required int displayPrice,
    required int originPrice,
    required bool hasDiscount,
    required int discountPercent,
    required double rating,
    required int stock,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // mã + đã bán
        Row(
          children: [
            if (variant != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Mã: ${variant.sku}',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Đã bán ${product.selledAmount}',
                style: const TextStyle(fontSize: 11),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        Text(
          product.name,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),

        Row(
          children: [
            const Icon(Icons.star, size: 16, color: Colors.orange),
            const SizedBox(width: 4),
            Text(
              rating.toStringAsFixed(1),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 4),
            Text(
              '(${product.reviewCount} đánh giá)',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 8),

        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              _formatPrice(displayPrice),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColor.buttonprimaryCol,
              ),
            ),
            const SizedBox(width: 8),
            if (hasDiscount)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatPrice(originPrice),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.grey,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.redAccent,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '-$discountPercent%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 6),
        if (stock < 20)
          Text(
            stock <= 0 ? 'Sản phẩm tạm hết hàng' : 'Chỉ còn $stock sản phẩm',
            style: const TextStyle(color: Colors.redAccent, fontSize: 12),
          ),
        const SizedBox(height: 12),

        // chọn variant
        if (_detail!.variants.isNotEmpty) ...[
          const Text(
            'Chọn biến thể',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _detail!.variants.map((v) {
              final selected = v.variantId == _selectedVariantId;
              return ChoiceChip(
                showCheckmark: false,
                selectedColor: AppColor.buttonprimaryCol,
                label: Text(
                  '${v.frameColor} • ${v.frameShape}',
                  style: TextStyle(
                    color: selected ? Colors.white : Colors.black,
                  ),
                ),
                selected: selected,
                onSelected: (_) {
                  setState(() {
                    _selectedVariantId = v.variantId;
                    // cập nhật gallery theo variant
                    final imgs = _detail!.imagesByVariant[v.variantId] ?? [];
                    if (imgs.isNotEmpty) {
                      _activeImageUrl = imgs.first.url;
                      _pageController.jumpToPage(0);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildDescriptionTab(ProductInfo product) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        product.description,
        style: const TextStyle(fontSize: 14, height: 1.4),
      ),
    );
  }

  Widget _buildSpecsTab(ProductInfo product, VariantModel? variant) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin sản phẩm',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _specRow('Chất liệu khung', variant?.frameMaterial ?? '—'),
          _specRow('Màu khung', variant?.frameColor ?? '—'),
          _specRow('Dáng khung', variant?.frameShape ?? '—'),
          _specRow('Xuất xứ', product.originCountry ?? 'Đang cập nhật'),
          _specRow(
            'Bảo vệ UV',
            (variant?.hasUvProtection ?? false) ? 'Có' : 'Không',
          ),
          const SizedBox(height: 16),
          const Text(
            'Kích thước khung',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _sizeBox('Lens width', variant?.lensWidth),
              _sizeBox('Bridge width', variant?.bridgeWidth),
              _sizeBox('Temple length', variant?.templeLength),
            ],
          ),
        ],
      ),
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sizeBox(String label, String? value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            value ?? '—',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsTab(ProductInfo product) {
    // dùng provider family theo productId
    final reviewState = ref.watch(
      productReviewsControllerProvider(widget.productId),
    );
    final controller = ref.read(
      productReviewsControllerProvider(widget.productId).notifier,
    );

    final authState = ref.watch(authControllerProvider);
    final isLoggedIn = authState.valueOrNull != null;

    // show error nếu có
    if (reviewState.errorMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(reviewState.errorMessage!)));
      });
    }

    if (reviewState.isLoading && reviewState.items.isEmpty) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }

    final items = reviewState.items;
    final avg = reviewState.avgRating;
    final myReview = reviewState.myReview;

    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              avg.toStringAsFixed(1),
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Chưa có đánh giá nào cho sản phẩm này',
              style: TextStyle(fontSize: 13, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            if (isLoggedIn)
              ElevatedButton(
                onPressed: () => _showReviewDialog(
                  controller: controller,
                  existing: myReview,
                ),
                child: const Text('Viết đánh giá'),
              ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // header avg rating + nút viết / sửa
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    avg.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${items.length} đánh giá',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Wrap(
                  alignment: WrapAlignment.end,
                  spacing: 8,
                  children: [
                    if (isLoggedIn && myReview != null)
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppColor.buttonprimaryCol),
                        ),
                        onPressed: () => _showReviewDialog(
                          controller: controller,
                          existing: myReview,
                        ),
                        child: Text('Sửa đánh giá', style: TextStyle(color: AppColor.buttonprimaryCol),),
                      ),
                    if (isLoggedIn && myReview == null)
                      ElevatedButton(
                        onPressed: () => _showReviewDialog(
                          controller: controller,
                          existing: null,
                        ),
                        child: const Text('Viết đánh giá'),
                      ),
                    if (isLoggedIn && myReview != null)
                      TextButton(
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Xoá đánh giá?'),
                              content: const Text(
                                'Bạn có chắc muốn xoá đánh giá này?',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(ctx).pop(false),
                                  child: const Text('Huỷ'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.of(ctx).pop(true),
                                  child: const Text(
                                    'Xoá',
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await controller.deleteMyReview();
                          }
                        },
                        child: const Text(
                          'Xoá đánh giá',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const Divider(height: 1),

        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final rv = items[index];
              return _buildReviewItem(rv);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(ReviewModel rv) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // avatar + tên + rating + ngày
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundImage: rv.user?.avatarUrl != null
                    ? NetworkImage(rv.user!.avatarUrl!)
                    : null,
                child: rv.user?.avatarUrl == null
                    ? Text(
                        rv.user?.displayName.substring(0, 1).toUpperCase() ??
                            'U',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rv.user?.displayName ?? 'Người dùng',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        Row(
                          children: List.generate(
                            5,
                            (i) => Icon(
                              i < rv.rating ? Icons.star : Icons.star_border,
                              size: 14,
                              color: Colors.orange,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${rv.createdAt.day}/${rv.createdAt.month}/${rv.createdAt.year}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                        if (rv.isEdited) ...[
                          const SizedBox(width: 4),
                          const Text(
                            'Đã chỉnh sửa',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(rv.comment, style: const TextStyle(fontSize: 13)),
          if (rv.images.isNotEmpty) ...[
            const SizedBox(height: 6),
            SizedBox(
              height: 70,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: rv.images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  final img = rv.images[index];
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      img.url,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                    ),
                  );
                },
              ),
            ),
          ],
          if (rv.videoUrl != null) ...[
            const SizedBox(height: 6),
            const Text(
              'Video đính kèm (chưa support play trên mobile — TODO)',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ],
      ),
    );
  }

  void _showReviewDialog({
    required ProductReviewsController controller,
    ReviewModel? existing,
  }) {
    final commentController = TextEditingController(
      text: existing?.comment ?? '',
    );

    final picker = ImagePicker();

    // State local cho dialog
    int _rating = existing?.rating ?? 5;
    List<File> _images = [];
    File? _videoFile;

    // Helper: Text mô tả theo số sao
    String _getRatingLabel(int star) {
      switch (star) {
        case 1:
          return 'Tệ';
        case 2:
          return 'Không hài lòng';
        case 3:
          return 'Bình thường';
        case 4:
          return 'Hài lòng';
        case 5:
          return 'Tuyệt vời';
        default:
          return '';
      }
    }

    showDialog(
      context: context,
      barrierDismissible: false, // Bắt buộc bấm Huỷ hoặc Gửi
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            // Hàm xoá ảnh
            void _removeImage(int index) {
              setStateDialog(() {
                _images.removeAt(index);
              });
            }

            // Hàm xoá video
            void _removeVideo() {
              setStateDialog(() {
                _videoFile = null;
              });
            }

            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              insetPadding: const EdgeInsets.all(20),
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. HEADER
                      Center(
                        child: Text(
                          existing == null
                              ? 'Đánh giá sản phẩm'
                              : 'Sửa đánh giá',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // 2. CHỌN SAO (Interactive)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          final starIndex = index + 1;
                          return GestureDetector(
                            onTap: () {
                              setStateDialog(() => _rating = starIndex);
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                              child: Icon(
                                starIndex <= _rating
                                    ? Icons.star_rounded
                                    : Icons.star_border_rounded,
                                color: Colors.amber, // Sao luôn màu vàng
                                size: 36,
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 8),
                      Center(
                        child: Text(
                          _getRatingLabel(_rating),
                          style: TextStyle(
                            color: Colors.amber[700],
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // 3. Ô NHẬP TEXT (Style Shopee: Nền xám, không viền)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: TextField(
                          controller: commentController,
                          maxLines: 5,
                          maxLength: 200, // Giới hạn ký tự giống Shopee
                          style: const TextStyle(fontSize: 14),
                          decoration: const InputDecoration(
                            hintText:
                                'Hãy chia sẻ nhận xét cho sản phẩm này bạn nhé!',
                            border: InputBorder.none,
                            hintStyle: TextStyle(
                              color: Colors.grey,
                              fontSize: 13,
                            ),
                            counterText: '', // Ẩn counter mặc định
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. KHU VỰC MEDIA (Ảnh + Video)
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Nút Thêm Ảnh/Video
                            GestureDetector(
                              onTap: () async {
                                // Logic chọn: Hỏi người dùng muốn chọn ảnh hay video
                                // Hoặc đơn giản là show bottom sheet nhỏ
                                showModalBottomSheet(
                                  context: context,
                                  builder: (bsContext) => Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      ListTile(
                                        leading: const Icon(
                                          Icons.photo_library,
                                        ),
                                        title: const Text('Thêm hình ảnh'),
                                        onTap: () async {
                                          Navigator.pop(bsContext);
                                          final picked = await picker
                                              .pickMultiImage(
                                                maxWidth: 1920,
                                                imageQuality: 85,
                                              );
                                          if (picked.isNotEmpty) {
                                            setStateDialog(() {
                                              _images.addAll(
                                                picked.map((x) => File(x.path)),
                                              );
                                            });
                                          }
                                        },
                                      ),
                                      ListTile(
                                        leading: const Icon(Icons.videocam),
                                        title: const Text('Thêm video'),
                                        onTap: () async {
                                          Navigator.pop(bsContext);
                                          final picked = await picker.pickVideo(
                                            source: ImageSource.gallery,
                                            maxDuration: const Duration(
                                              seconds: 60,
                                            ),
                                          );
                                          if (picked != null) {
                                            setStateDialog(
                                              () => _videoFile = File(
                                                picked.path,
                                              ),
                                            );
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                              child: Container(
                                width: 70,
                                height: 70,
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: AppColor.buttonprimaryCol,
                                    style: BorderStyle.solid,
                                  ), // Viền xanh nét đứt hoặc liền
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.camera_alt_outlined,
                                      color: AppColor.buttonprimaryCol,
                                      size: 24,
                                    ),
                                    Text(
                                      'Thêm',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: AppColor.buttonprimaryCol,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Hiển thị Video đã chọn
                            if (_videoFile != null)
                              _MediaThumbnail(
                                file: _videoFile!,
                                isVideo: true,
                                onRemove: _removeVideo,
                              ),

                            // Hiển thị List Ảnh
                            ..._images.asMap().entries.map((entry) {
                              return _MediaThumbnail(
                                file: entry.value,
                                isVideo: false,
                                onRemove: () => _removeImage(entry.key),
                              );
                            }),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // 5. BUTTONS
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.of(ctx).pop(),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: Colors.grey.shade400),
                                foregroundColor: Colors.black87,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text('Trở lại'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                final comment = commentController.text.trim();
                                if (comment.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Vui lòng viết nội dung đánh giá',
                                      ),
                                    ),
                                  );
                                  return;
                                }

                                await controller.createOrUpdate(
                                  rating: _rating,
                                  comment: comment,
                                  images: _images,
                                  videoFile: _videoFile,
                                );

                                if (context.mounted) {
                                  Navigator.of(ctx).pop();
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColor.buttonprimaryCol,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                elevation: 0,
                              ),
                              child: const Text('Gửi đánh giá'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _MediaThumbnail extends StatelessWidget {
  final File file;
  final bool isVideo;
  final VoidCallback onRemove;

  const _MediaThumbnail({
    required this.file,
    required this.isVideo,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 70,
          height: 70,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(4),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: isVideo
                ? Container(
                    color: Colors.black12,
                    child: const Center(
                      child: Icon(
                        Icons.play_circle_fill,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  )
                : Image.file(file, fit: BoxFit.cover),
          ),
        ),
        Positioned(
          top: -6,
          right: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
