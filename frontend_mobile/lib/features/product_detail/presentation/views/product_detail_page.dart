import 'dart:ui' show lerpDouble;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/common/cart_icon_button.dart';
import 'package:frontend_mobile/core/di/providers.dart'
    show
        productDetailRepositoryProvider,
        cartControllerProvider,
        authControllerProvider;
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/product_detail/data/model/product_detail_model.dart';
import 'package:go_router/go_router.dart';

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
    // TODO: sau này nối API review mobile giống web
    return const Center(
      child: Text(
        'Tính năng đánh giá sẽ được cập nhật trên app mobile.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 13, color: Colors.grey),
      ),
    );
  }
}
