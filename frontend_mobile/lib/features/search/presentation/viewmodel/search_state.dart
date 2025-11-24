// lib/features/search/presentation/viewmodels/search_state.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/search/data/repository/search_repository.dart';

class SearchState {
  final String query;
  final bool isLoading;
  final SearchSuggestResult? result; // null = chưa fetch gì
  final List<String> recent;

  const SearchState({
    this.query = '',
    this.isLoading = false,
    this.result,
    this.recent = const [],
  });

  SearchState copyWith({
    String? query,
    bool? isLoading,
    SearchSuggestResult? result,
    bool clearResult = false,
    List<String>? recent,
  }) {
    return SearchState(
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      result: clearResult ? null : (result ?? this.result),
      recent: recent ?? this.recent,
    );
  }
}

class SearchController extends StateNotifier<SearchState> {
  final SearchRepository _repo;
  Timer? _debounce;

  SearchController(this._repo) : super(const SearchState());

  // user gõ text
  void updateQuery(String q) {
    state = state.copyWith(query: q);

    _debounce?.cancel();

    if (q.trim().isEmpty) {
      // clear suggestion
      state = state.copyWith(clearResult: true, isLoading: false);
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 300), () {
      _fetchSuggestions(q);
    });
  }

  Future<void> _fetchSuggestions(String keyword) async {
    state = state.copyWith(isLoading: true);
    try {
      final result = await _repo.fetch(keyword);
      state = state.copyWith(isLoading: false, result: result);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  // thêm vào lịch sử
  void addRecent(String kw) {
    final k = kw.trim();
    if (k.isEmpty) return;

    final list = [...state.recent];
    list.remove(k);
    list.insert(0, k);

    state = state.copyWith(recent: list);
    // sau này có thể lưu SharedPreferences ở đây
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
