import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:frontend_mobile/core/di/providers.dart'
    show cartControllerProvider;
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/cart/data/models/cart_models.dart';
import 'package:frontend_mobile/features/cart/presentation/viewmodels/cart_state.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:go_router/go_router.dart';

class CartPage extends ConsumerStatefulWidget {
  const CartPage({super.key});

  @override
  ConsumerState<CartPage> createState() => _CartPageState();
}

class _CartPageState extends ConsumerState<CartPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(cartControllerProvider.notifier).loadCart(),
    );
  }

  String _formatPrice(int price) {
    final str = price.toString();
    final reg = RegExp(r'\B(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (m) => '.') + 'đ';
  }

  @override
  Widget build(BuildContext context) {
    final CartState state = ref.watch(cartControllerProvider);
    final cart = state.cart;

    // loading lần đầu
    if (state.isLoading && cart == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // giỏ trống
    if (cart == null || cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Giỏ hàng',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: AppColor.buttonprimaryCol,
          foregroundColor: Colors.white,
        ),
        backgroundColor: const Color(0xfff5f5f5),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.grey),
              SizedBox(height: 12),
              Text(
                'Giỏ hàng trống',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 4),
              Text(
                'Bạn chưa có sản phẩm nào trong giỏ',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    // tính tổng của items đang được chọn
    final List<CartItemModel> selectedItems = cart.items
        .where((i) => state.selectedItemIds.contains(i.itemId))
        .toList();

    final int selectedOriginal = selectedItems.fold(
      0,
      (sum, i) => sum + i.originalSubtotal,
    );
    final int selectedAmount = selectedItems.fold(
      0,
      (sum, i) => sum + i.subtotal,
    );
    final int selectedDiscount = selectedOriginal - selectedAmount;

    final bool allSelected =
        state.selectedItemIds.length == cart.items.length &&
        cart.items.isNotEmpty;

    // tổng số sản phẩm (có thể dùng cart.totalQuantity nếu bạn có field đó)
    final int totalItems = cart.items.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Giỏ hàng ($totalItems)',
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
      ),
      backgroundColor: const Color(0xfff5f5f5),
      body: RefreshIndicator(
        onRefresh: () => ref.read(cartControllerProvider.notifier).loadCart(),
        child: ListView.separated(
          padding: const EdgeInsets.only(top: 8, bottom: 80),
          itemCount: cart.items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 6),
          itemBuilder: (context, index) {
            final item = cart.items[index];
            final selected = state.selectedItemIds.contains(item.itemId);
            return _buildCartItem(context, item, selected, state);
          },
        ),
      ),

      // ===== bottom bar giống Shopee: trên là chọn tất cả, dưới là tổng tiền + mua hàng =====
      bottomNavigationBar: Container(
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // dòng "Chọn tất cả" giống Shopee
                Row(
                  children: [
                    Checkbox(
                      activeColor: AppColor.buttonprimaryCol,
                      value: allSelected,
                      onChanged: (_) => ref
                          .read(cartControllerProvider.notifier)
                          .toggleSelectAll(),
                    ),
                    const Text(
                      'Chọn tất cả',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                    if (selectedDiscount > 0)
                      Text(
                        'Tiết kiệm ${_formatPrice(selectedDiscount)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                // dòng tổng tiền + nút mua
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Tổng thanh toán',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatPrice(selectedAmount),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColor.buttonprimaryCol,
                              
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: selectedItems.isEmpty || state.isUpdating
                          ? null
                          : () {
                              // lấy list itemId của các item đang chọn
                              final itemIds = selectedItems
                                  .map((e) => e.itemId)
                                  .toList();

                              context.pushNamed(
                                'checkout',
                                extra: CheckoutArgs.fromCart(
                                  cartItemIds: itemIds,
                                ),
                              );
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColor.buttonprimaryCol,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 10,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                      child: Text(
                        'Mua hàng (${selectedItems.length})',
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCartItem(
    BuildContext context,
    CartItemModel item,
    bool selected,
    CartState state,
  ) {
    final controller = ref.read(cartControllerProvider.notifier);

    return Slidable(
      key: ValueKey(item.itemId),
      endActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.2, // Giảm tỷ lệ kéo để gọn hơn
        children: [
          SlidableAction(
            onPressed: (_) {
              if (!state.isUpdating) {
                controller.removeItem(item.itemId);
              }
            },
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            icon: Icons.delete_outline,
            label: 'Xoá',
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(10),
              bottomLeft: Radius.circular(10),
            ),
          ),
        ],
      ),
      child: Container(
        // Giảm margin và padding để item khít nhau hơn
        padding: const EdgeInsets.fromLTRB(8, 12, 12, 12),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8), // Shopee bo góc nhẹ hơn
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center, // Căn lề trên
          children: [
            // 1. CHECKBOX "SHOPEE STYLE" (Nhỏ gọn)
            SizedBox(
              width: 30, // Giới hạn chiều rộng vùng bấm
              child: Align(
                alignment: Alignment.centerLeft,
                child: Transform.scale(
                  scale: 0.9, // Thu nhỏ kích thước checkbox
                  child: Checkbox(
                    activeColor: AppColor.buttonprimaryCol,
                    materialTapTargetSize:
                        MaterialTapTargetSize.shrinkWrap, // Bỏ padding thừa
                    visualDensity: VisualDensity.compact, // Thu gọn density
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(3),
                    ),
                    value: selected,
                    onChanged: (_) => controller.toggleSelectItem(item.itemId),
                  ),
                ),
              ),
            ),

            // 2. ẢNH SẢN PHẨM
            ClipRRect(
              borderRadius: BorderRadius.circular(4), // Bo góc nhẹ
              child: Image.network(
                item.thumbnailUrl!,
                width: 80, // Ảnh to hơn xíu cho rõ
                height: 80,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),

            // 3. THÔNG TIN + SỐ LƯỢNG
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tên sản phẩm
                  Text(
                    item.productName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight:
                          FontWeight.w400, // Shopee dùng font thường cho tên
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Phân loại hàng (Biến thể) - Style box xám
                  if (item.frameShape != null || item.frameColor != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xfff5f5f5), // Nền xám nhạt
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              [
                                if (item.frameShape != null) item.frameShape,
                                if (item.frameColor != null) item.frameColor,
                              ].join(' , '),
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.keyboard_arrow_down,
                            size: 14,
                            color: Colors.grey,
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 8),

                  // Giá và Bộ tăng giảm nằm cùng hàng
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Cụm giá
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (item.hasDiscount)
                            Text(
                              _formatPrice(item.originalUnitPrice),
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.grey,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          Text(
                            _formatPrice(item.unitPrice),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600, // Giá đậm vừa phải
                              color: AppColor.buttonprimaryCol,
                            ),
                          ),
                        ],
                      ),

                      // Bộ tăng giảm số lượng (Compact)
                      Container(
                        height: 26, // Chiều cao cố định nhỏ gọn
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Row(
                          children: [
                            _buildQtyBtn(
                              icon: Icons.remove,
                              onTap: state.isUpdating || item.quantity <= 1
                                  ? null
                                  : () => controller.updateItemQuantity(
                                      item.itemId,
                                      item.quantity - 1,
                                    ),
                            ),
                            Container(
                              width: 32, // Chiều rộng cố định cho số
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                border: Border.symmetric(
                                  vertical: BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                ),
                              ),
                              child: Text(
                                '${item.quantity}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            _buildQtyBtn(
                              icon: Icons.add,
                              onTap: state.isUpdating
                                  ? null
                                  : () => controller.updateItemQuantity(
                                      item.itemId,
                                      item.quantity + 1,
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget con cho nút +/- để code gọn hơn
  Widget _buildQtyBtn({required IconData icon, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 26,
        height: 26,
        child: Icon(
          icon,
          size: 14,
          color: onTap == null ? Colors.grey[300] : Colors.grey[600],
        ),
      ),
    );
  }
}
