import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/search/data/repository/search_result_repository.dart';
import 'package:frontend_mobile/features/search/presentation/viewmodel/search_result_state.dart';

class SearchResultController extends StateNotifier<SearchResultState> {
  final SearchResultRepository _repo;

  SearchResultController(this._repo) : super(const SearchResultState());

  /// gọi khi mở màn lần đầu
  Future<void> init({
    required String query,
    String? gender,
    String? shape,
    String? type,
  }) async {
    state = state.copyWith(
      query: query,
      gender: gender,
      shape: shape,
      type: type,
      page: 1,
    );
    await _fetch(page: 1);
  }

  Future<void> _fetch({int? page}) async {
    final currentPage = page ?? state.page;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final res = await _repo.searchProducts(
        q: state.query,
        gender: state.gender,
        shape: state.shape,
        type: state.type,
        page: currentPage,
        limit: state.limit,
        sort: state.sort,
      );

      state = state.copyWith(
        isLoading: false,
        page: res.page,
        total: res.total,
        limit: res.limit,
        items: res.items,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ====== các hàm public cho UI gọi ======

  Future<void> changePage(int newPage) async {
    if (newPage < 1) return;
    await _fetch(page: newPage);
  }

  Future<void> refresh() async {
    await _fetch(page: 1);
  }

  void updateQuery(String q) {
    state = state.copyWith(query: q);
  }

  Future<void> submitSearch() async {
    await _fetch(page: 1);
  }

  Future<void> changeGender(String? gender) async {
    state = state.copyWith(gender: gender, page: 1);
    await _fetch(page: 1);
  }

  Future<void> changeShape(String? shape) async {
    state = state.copyWith(shape: shape, page: 1);
    await _fetch(page: 1);
  }

  Future<void> changeSort(String sort) async {
    state = state.copyWith(sort: sort, page: 1);
    await _fetch(page: 1);
  }
}
