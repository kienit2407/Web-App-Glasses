import 'package:frontend_mobile/features/order/data/models/order_model.dart';

const kOrderStatusKeys = [
  'all',
  'pending',
  'processing',
  'shipping',
  'delivering',
  'delivered',
  'cancelled',
  'cancel_requested',
  'return_requested',
  'returned',
];

class OrdersListState {
  final List<OrderModel> items;
  final int page;
  final bool hasMore;
  final bool loading; // load lần đầu / refresh
  final bool loadingMore; // load thêm
  final String? errorMessage;

  const OrdersListState({
    this.items = const [],
    this.page = 1,
    this.hasMore = true,
    this.loading = false,
    this.loadingMore = false,
    this.errorMessage,
  });

  factory OrdersListState.initial() => const OrdersListState();

  OrdersListState copyWith({
    List<OrderModel>? items,
    int? page,
    bool? hasMore,
    bool? loading,
    bool? loadingMore,
    String? errorMessage,
  }) {
    return OrdersListState(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      loading: loading ?? this.loading,
      loadingMore: loadingMore ?? this.loadingMore,
      errorMessage: errorMessage,
    );
  }
}

class OrdersState {
  final String activeStatus;
  final Map<String, OrdersListState> lists;
  final Map<String, int> statusCounts;

  // loading id cho từng action
  final String? cancellingId;
  final String? confirmingId;
  final String? returningId;
  final String? reorderingId;

  const OrdersState({
    required this.activeStatus,
    required this.lists,
    this.statusCounts = const {},
    this.cancellingId,
    this.confirmingId,
    this.returningId,
    this.reorderingId,
  });

  factory OrdersState.initial() {
    final map = <String, OrdersListState>{
      for (final s in kOrderStatusKeys) s: OrdersListState.initial(),
    };
    return OrdersState(activeStatus: 'all', lists: map, statusCounts: const {});
  }

  OrdersState copyWith({
    String? activeStatus,
    Map<String, OrdersListState>? lists,
    Map<String, int>? statusCounts,
    String? cancellingId,
    String? confirmingId,
    String? returningId,
    String? reorderingId,
  }) {
    return OrdersState(
      activeStatus: activeStatus ?? this.activeStatus,
      lists: lists ?? this.lists,
      statusCounts: statusCounts ?? this.statusCounts,
      cancellingId: cancellingId,
      confirmingId: confirmingId,
      returningId: returningId,
      reorderingId: reorderingId,
    );
  }
}
