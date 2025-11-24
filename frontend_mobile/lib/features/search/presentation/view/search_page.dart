// lib/features/search/presentation/views/search_page.dart

import 'dart:async';
import 'package:diacritic/diacritic.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final TextEditingController _controller = TextEditingController();
  Timer? _debounce;
  bool _isLoading = false;

  String _query = '';
  final List<String> _suggestions = [];
  final List<String> _recent = []; // sẽ load từ SharedPreferences

  // 🔹 KEY dùng để lưu trong SharedPreferences
  static const _recentKey = 'search_recent_keywords';

  @override
  void initState() {
    super.initState();
    _loadRecent(); // 👉 load lịch sử ngay khi mở màn
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  // ================== LOAD / SAVE RECENT ==================

  Future<void> _loadRecent() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_recentKey) ?? [];
    setState(() {
      _recent
        ..clear()
        ..addAll(list);
    });
  }

  Future<void> _saveRecent() async {
    final prefs = await SharedPreferences.getInstance();
    // Giới hạn 10 từ khoá gần nhất cho gọn
    await prefs.setStringList(_recentKey, _recent.take(10).toList());
  }

  // ================== LOGIC SEARCH ==================

  void _onChanged(String value) {
    setState(() {
      _query = value;
    });

    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _fetchSuggestions(value);
    });
  }

  Future<void> _fetchSuggestions(String keyword) async {
    if (keyword.trim().isEmpty) {
      setState(() => _suggestions.clear());
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repo = ref.read(searchRepositoryProvider);
      final list = await repo.fetchSuggestions(keyword);
      setState(() {
        _suggestions
          ..clear()
          ..addAll(list);
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onSubmit(String keyword) async {
    final k = keyword.trim();
    if (k.isEmpty) return;

    // thêm vào lịch sử (đẩy lên đầu, xoá bản cũ nếu trùng)
    setState(() {
      _recent.remove(k);
      _recent.insert(0, k);
    });
    await _saveRecent(); // 🔹 lưu lại

    context.push(
      '/search-result',
      extra: {'query': k, 'gender': null, 'shape': null, 'type': null},
    );
  }

  // ================== UI ==================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: _buildSearchAppBar(context),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_query.isEmpty && _recent.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                'Tìm kiếm gần đây',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _recent.length,
                itemBuilder: (context, index) {
                  final kw = _recent[index];
                  return ListTile(
                    leading: const Icon(Icons.history, size: 18),
                    title: Text(kw, style: const TextStyle(fontSize: 14)),
                    onTap: () => _onSubmit(kw),
                  );
                },
              ),
            ),
          ] else ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                'Gợi ý tìm kiếm',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      itemCount: _suggestions.length,
                      itemBuilder: (context, index) {
                        final text = _suggestions[index];
                        return ListTile(
                          leading: const Icon(Icons.search, size: 18),
                          title: _buildHighlightedText(text, _query),
                          onTap: () => _onSubmit(text),
                        );
                      },
                    ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppColor.buttonprimaryCol,
      elevation: 0,
      automaticallyImplyLeading: false,
      titleSpacing: 0,
      title: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: [
                    const Icon(Icons.search, size: 18, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(
                      child: TextField(
                        cursorColor: AppColor.buttonprimaryCol,
                        cursorWidth: 2,
                        controller: _controller,
                        autofocus: true,
                        decoration: const InputDecoration(
                          hintText: 'Tìm kiếm sản phẩm',
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        textInputAction: TextInputAction.search,
                        onChanged: _onChanged,
                        onSubmitted: _onSubmit,
                      ),
                    ),
                    if (_query.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          _controller.clear();
                          _onChanged('');
                        },
                        child: const Icon(
                          Icons.close,
                          size: 18,
                          color: Colors.grey,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHighlightedText(String text, String query) {
    if (query.isEmpty) {
      return Text(text, style: const TextStyle(fontSize: 14));
    }

    final normalizedText = _normalizeViLib(text);
    final normalizedQuery = _normalizeViLib(query);

    if (!normalizedText.contains(normalizedQuery)) {
      return Text(text, style: const TextStyle(fontSize: 14));
    }

    final start = normalizedText.indexOf(normalizedQuery);
    final end = start + normalizedQuery.length;

    return RichText(
      text: TextSpan(
        style: const TextStyle(color: Colors.black, fontSize: 14),
        children: [
          TextSpan(text: text.substring(0, start)),
          TextSpan(
            text: text.substring(start, end),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(text: text.substring(end)),
        ],
      ),
    );
  }
}

String _normalizeViLib(String input) {
  var s = input.toLowerCase();
  s = removeDiacritics(s);
  s = s.replaceAll('đ', 'd');
  return s;
}
