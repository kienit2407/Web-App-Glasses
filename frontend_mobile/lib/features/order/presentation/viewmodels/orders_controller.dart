import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/order/data/models/order_model.dart';
import 'package:frontend_mobile/features/order/data/repository/order_repository.dart';
import 'package:frontend_mobile/features/order/presentation/viewmodels/orders_state.dart';

class OrdersController extends StateNotifier<OrdersState> {
  OrdersController(this._repo) : super(OrdersState.initial());

  final OrderRepository _repo;
  static const _pageSize = 10;

  Future<void> init() async {
    // load stats + load tab "all"
    await Future.wait([
      loadStatusCounts(),
      fetchFirstPageForStatus('all'),
    ]);
  }

  Future<void> loadStatusCounts() async {
    try {
      final stats = await _repo.getStats();
      state = state.copyWith(statusCounts: stats);
    } catch (_) {
      // bỏ qua, không critical
    }
  }

  Future<void> fetchFirstPageForStatus(String status) async {
    final current = state.lists[status] ?? OrdersListState.initial();
    final newLists = Map<String, OrdersListState>.from(state.lists);
    newLists[status] = current.copyWith(
      loading: true,
      loadingMore: false,
      page: 1,
      errorMessage: null,
    );
    state = state.copyWith(lists: newLists);

    try {
      final resp = await _repo.listMy(
        status: status,
        page: 1,
        limit: _pageSize,
      );

      final hasMore = resp.total > resp.items.length;

      newLists[status] = current.copyWith(
        items: resp.items,
        page: resp.page,
        hasMore: hasMore,
        loading: false,
        loadingMore: false,
        errorMessage: null,
      );

      state = state.copyWith(lists: newLists);
    } catch (e) {
      newLists[status] = current.copyWith(
        loading: false,
        loadingMore: false,
        errorMessage: e.toString(),
      );
      state = state.copyWith(lists: newLists);
    }
  }

  Future<void> refreshStatus(String status) async {
    await fetchFirstPageForStatus(status);
    await loadStatusCounts();
  }

  Future<void> loadMore(String status) async {
    final current = state.lists[status] ?? OrdersListState.initial();

    if (!current.hasMore || current.loading || current.loadingMore) return;

    final newLists = Map<String, OrdersListState>.from(state.lists);
    newLists[status] = current.copyWith(loadingMore: true);
    state = state.copyWith(lists: newLists);

    try {
      final nextPage = current.page + 1;
      final resp = await _repo.listMy(
        status: status,
        page: nextPage,
        limit: _pageSize,
      );

      final combined = <OrderModel>[
        ...current.items,
        ...resp.items,
      ];

      final hasMore = resp.total > combined.length;

      newLists[status] = current.copyWith(
        items: combined,
        page: resp.page,
        hasMore: hasMore,
        loadingMore: false,
        errorMessage: null,
      );

      state = state.copyWith(lists: newLists);
    } catch (e) {
      newLists[status] =
          current.copyWith(loadingMore: false, errorMessage: e.toString());
      state = state.copyWith(lists: newLists);
    }
  }

  void setActiveStatus(String status) {
    state = state.copyWith(activeStatus: status);
    final list = state.lists[status] ?? OrdersListState.initial();

    if (list.items.isEmpty && !list.loading && !list.loadingMore) {
      fetchFirstPageForStatus(status);
    }
  }

  Future<void> requestCancel(String orderId, String status) async {
    state = state.copyWith(cancellingId: orderId);
    try {
      await _repo.requestCancel(orderId);
      await refreshStatus(status);
    } finally {
      state = state.copyWith(cancellingId: null);
    }
  }

  Future<void> confirmDelivered(String orderId, String status) async {
    state = state.copyWith(confirmingId: orderId);
    try {
      await _repo.confirmDelivered(orderId);
      await refreshStatus(status);
    } finally {
      state = state.copyWith(confirmingId: null);
    }
  }

  Future<void> requestReturn(String orderId, String status) async {
    state = state.copyWith(returningId: orderId);
    try {
      await _repo.requestReturn(orderId);
      await refreshStatus(status);
    } finally {
      state = state.copyWith(returningId: null);
    }
  }

  /// return true nếu reorder thành công (để UI điều hướng sang giỏ hàng)
  Future<bool> reorder(String orderId, String status) async {
    state = state.copyWith(reorderingId: orderId);
    try {
      await _repo.reorder(orderId);
      await refreshStatus(status);
      return true;
    } catch (_) {
      return false;
    } finally {
      state = state.copyWith(reorderingId: null);
    }
  }
}
