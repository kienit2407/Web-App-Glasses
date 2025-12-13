import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/order/data/models/order_model.dart';
import 'package:frontend_mobile/features/order/presentation/viewmodels/orders_state.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class OrdersPage extends ConsumerStatefulWidget {
  const OrdersPage({super.key});

  @override
  ConsumerState<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends ConsumerState<OrdersPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  final _tabs = const [
    {'key': 'all', 'label': 'Tất cả'},
    {'key': 'pending', 'label': 'Chờ xác nhận'},
    {'key': 'processing', 'label': 'Đang xử lý'},
    {'key': 'shipping', 'label': 'Vận chuyển'},
    {'key': 'delivering', 'label': 'Chờ giao'},
    {'key': 'delivered', 'label': 'Hoàn thành'},
    {'key': 'cancelled', 'label': 'Đã huỷ'},
    {'key': 'returned', 'label': 'Trả hàng/Hoàn tiền'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    Future.microtask(() {
      ref.read(ordersControllerProvider.notifier).init();
    });

    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      final key = _tabs[_tabController.index]['key'] as String;
      ref.read(ordersControllerProvider.notifier).setActiveStatus(key);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(ordersControllerProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5), // Màu nền tổng thể xám nhạt
      appBar: AppBar(
        title: const Text(
          'Đơn mua',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white, // Chữ đen cho sang trọng
        elevation: 0,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Container(
            color: Colors.white,
            width: double.infinity,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: AppColor.buttonprimaryCol,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: AppColor.buttonprimaryCol,
              indicatorSize: TabBarIndicatorSize.label,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              unselectedLabelStyle: const TextStyle(
                fontWeight: FontWeight.normal,
              ),
              padding: EdgeInsets.zero,
              tabs: _tabs
                  .map(
                    (t) => Tab(
                      child: _buildTabLabel(
                        t['key'] as String,
                        t['label'] as String,
                        ordersState.statusCounts,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs
            .map((t) => OrdersTabContent(status: t['key'] as String))
            .toList(),
      ),
    );
  }

  Widget _buildTabLabel(String key, String label, Map<String, int> counts) {
    final count = counts[key] ?? 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label),
        if (count > 0) ...[
          const SizedBox(width: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                fontSize: 10,
                color: Colors.red.shade700,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class OrdersTabContent extends ConsumerStatefulWidget {
  const OrdersTabContent({super.key, required this.status});
  final String status;

  @override
  ConsumerState<OrdersTabContent> createState() => _OrdersTabContentState();
}

class _OrdersTabContentState extends ConsumerState<OrdersTabContent> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final max = _scrollController.position.maxScrollExtent;
    final offset = _scrollController.position.pixels;
    if (max - offset < 200) {
      ref.read(ordersControllerProvider.notifier).loadMore(widget.status);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersControllerProvider);
    final listState = state.lists[widget.status] ?? OrdersListState.initial();

    if (listState.loading && listState.items.isEmpty) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }

    // Empty State đẹp hơn
    if (listState.items.isEmpty) {
      return RefreshIndicator.adaptive(
        onRefresh: () => ref
            .read(ordersControllerProvider.notifier)
            .refreshStatus(widget.status),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Iconsax.receipt_2,
                      size: 60,
                      color: Colors.grey[400],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Chưa có đơn hàng nào',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator.adaptive(
      onRefresh: () => ref
          .read(ordersControllerProvider.notifier)
          .refreshStatus(widget.status),
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: 8),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: listState.items.length + (listState.hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          if (index >= listState.items.length) {
            if (listState.loadingMore) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator.adaptive()),
              );
            }
            return const SizedBox.shrink();
          }

          final order = listState.items[index];
          return OrderCard(
            order: order,
            state: state,
            statusKey: widget.status,
          );
        },
      ),
    );
  }
}

// --- WIDGET CARD ĐƠN HÀNG RIÊNG BIỆT ---
class OrderCard extends ConsumerWidget {
  const OrderCard({
    super.key,
    required this.order,
    required this.state,
    required this.statusKey,
  });

  final OrderModel order;
  final OrdersState state;
  final String statusKey;

  String _formatPrice(int price) {
    return '${price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}đ';
  }

  // ... (Giữ nguyên các hàm _statusLabel, _statusColor)
  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang vận chuyển';
      case 'delivering':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã huỷ';
      case 'returned':
        return 'Đã trả hàng';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'processing':
        return Colors.blue;
      case 'shipping':
      case 'delivering':
        return Colors.teal;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      case 'returned':
        return Colors.red;
      default:
        return Colors.black;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCancelling = state.cancellingId == order.id;
    final isConfirming = state.confirmingId == order.id;
    final isReturning = state.returningId == order.id;
    final isReordering = state.reorderingId == order.id;

    // 1. Dùng Material để InkWell hoạt động trên nền trắng
    return Material(
      color: Colors.white,
      child: InkWell(
        // 2. Chuyển sự kiện bấm vào đây
        onTap: () {
          context.pushNamed('order-detail', pathParameters: {'id': order.id});
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              // 1. Header: Tên Shop + Trạng thái
              Row(
                children: [
                  const Icon(Iconsax.shop, size: 18, color: Colors.black87),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      order.shopName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    _statusLabel(order.status).toUpperCase(),
                    style: TextStyle(
                      color: _statusColor(order.status),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const Divider(height: 20, thickness: 0.5),

              // 2. Danh sách sản phẩm
              ...order.items.map(
                (it) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade200),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: Image.network(
                            it.thumbnailUrl,
                            width: 70,
                            height: 70,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: Colors.grey[200],
                              width: 70,
                              height: 70,
                              child: const Icon(Icons.image),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              it.productName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, height: 1.2,),
                            ),
                            const SizedBox(height: 4),
                            if (it.variantName != null &&
                                it.variantName!.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Phân loại: ${it.variantName}',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'x${it.quantity}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                Text(
                                  _formatPrice(it.price),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Colors.black87,
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
              ),

              const Divider(height: 1, thickness: 0.5),

              // 3. Tổng tiền
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Text('Thành tiền: ', style: TextStyle(fontSize: 13)),
                    Text(
                      _formatPrice(order.totalAmount),
                      style: const TextStyle(
                        color: AppColor.buttonprimaryCol,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              // 4. Action Buttons (Chỉ hiển thị nếu có nút chức năng)
              // Logic check để ẩn Divider và Row nếu không có nút nào
              Builder(
                builder: (context) {
                  final buttons = _buildButtons(
                    context,
                    ref,
                    isCancelling,
                    isConfirming,
                    isReordering,
                    isReturning,
                  );
                  if (buttons.isEmpty) return const SizedBox.shrink();

                  return Column(
                    children: [
                      const Divider(height: 1, thickness: 0.5),
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            const Spacer(),
                            Wrap(spacing: 8, children: buttons),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildButtons(
    BuildContext context,
    WidgetRef ref,
    bool isCancelling,
    bool isConfirming,
    bool isReordering,
    bool isReturning,
  ) {
    final notifier = ref.read(ordersControllerProvider.notifier);
    final btns = <Widget>[];

    // Helper tạo nút Outlined
    Widget outlineBtn(
      String text,
      VoidCallback? onTap, {
      bool loading = false,
    }) {
      return OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.grey.shade300),
          foregroundColor: Colors.black87,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          visualDensity: VisualDensity.compact,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        child: loading
            ? const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
      );
    }

    // Helper tạo nút Filled
    Widget filledBtn(
      String text,
      VoidCallback? onTap, {
      bool loading = false,
      Color? color,
    }) {
      return ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? AppColor.buttonprimaryCol,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          visualDensity: VisualDensity.compact,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        child: loading
            ? const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
      );
    }

    // 3. ĐÃ XÓA NÚT "XEM CHI TIẾT" Ở ĐÂY

    if (['pending', 'processing', 'shipping'].contains(order.status)) {
      btns.add(
        filledBtn(
          'Huỷ đơn',
          isCancelling
              ? null
              : () => notifier.requestCancel(order.id, statusKey),
          loading: isCancelling,
          color: Colors.red[400],
        ),
      );
    }

    if (order.status == 'delivering') {
      btns.add(
        filledBtn(
          'Đã nhận hàng',
          isConfirming
              ? null
              : () => notifier.confirmDelivered(order.id, statusKey),
          loading: isConfirming,
        ),
      );
    }

    if (order.status == 'delivered') {
      btns.add(
        outlineBtn(
          'Y/c Trả hàng',
          isReturning
              ? null
              : () => notifier.requestReturn(order.id, statusKey),
          loading: isReturning,
        ),
      );
      btns.add(
        filledBtn(
          'Mua lại',
          isReordering
              ? null
              : () async {
                  final ok = await notifier.reorder(order.id, statusKey);
                  if (ok && context.mounted) context.push('/cart');
                },
          loading: isReordering,
        ),
      );
    }

    return btns;
  }
}
