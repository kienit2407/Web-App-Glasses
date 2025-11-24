// lib/features/search/presentation/views/search_result_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/common/app_button.dart';
import 'package:frontend_mobile/core/common/product_cart.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/home/data/models/product_list_item.dart';
import 'package:frontend_mobile/features/product_detail/presentation/views/product_detail_page.dart';
import 'package:go_router/go_router.dart';

class SearchResultPage extends ConsumerStatefulWidget {
  const SearchResultPage({
    super.key,
    required this.initialQuery,
    this.initialGender,
    this.initialShape,
    this.initialBrandId,
    this.initialType,
  });

  final String initialQuery;
  final String? initialGender;
  final String? initialShape;
  final String? initialBrandId;
  final String? initialType; // frame | sunglasses

  @override
  ConsumerState<SearchResultPage> createState() => _SearchResultPageState();
}

class _SearchResultPageState extends ConsumerState<SearchResultPage> {
  bool _isLoading = false;
  int _page = 1;
  int _total = 0;
  int _limit = 20;

  String _query = '';
  String? _gender;
  String? _shape;
  String? _type;
  String? _sort = 'newest';
  String? _brandId;
  // sau này có thể thêm categories / brands list từ API
  final List<ProductListItem> _items = [];

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery;
    _gender = widget.initialGender;
    _shape = widget.initialShape;
    _brandId = widget.initialBrandId;
    _type = widget.initialType;
    _load(page: 1, reset: true);
  }

  Future<void> _load({
    int page = 1,
    bool reset = false,
    bool keepQuery = true,
  }) async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(searchResultRepositoryProvider);
      final res = await repo.searchProducts(
        q: keepQuery ? _query : null,
        gender: _gender,
        shape: _shape,
        brandId: _brandId,
        type: _type,
        page: page,
        limit: _limit,
        sort: _sort ?? 'newest',
      );
      setState(() {
        _page = res.page;
        _total = res.total;
        _limit = res.limit;
        if (reset) {
          _items
            ..clear()
            ..addAll(res.items);
        } else {
          _items.addAll(res.items);
        }
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  int get _totalPages => _limit > 0 ? ((_total + _limit - 1) ~/ _limit) : 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      backgroundColor: const Color(0xfff5f5f5),
      body: Column(
        children: [
          _buildQuickFilters(),
          Expanded(
            child: _isLoading && _items.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                ? const Center(child: Text('Không tìm thấy sản phẩm'))
                : RefreshIndicator(
                    onRefresh: () => _load(page: 1, reset: true),
                    child: GridView.builder(
                      padding: const EdgeInsets.all(8),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                            childAspectRatio: 0.63,
                          ),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final p = _items[index];
                        return _ProductCard(product: p);
                      },
                    ),
                  ),
          ),
          if (_totalPages > 1) _buildPagination(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColor.buttonprimaryCol,
      foregroundColor: Colors.white,
      titleSpacing: 0,
      title: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
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
                        controller: TextEditingController(text: _query),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        textInputAction: TextInputAction.search,
                        onSubmitted: (val) {
                          _query = val.trim();
                          _load(page: 1, reset: true);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.filter_alt_outlined, color: Colors.white),
              onPressed: _openFilterBottomSheet,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          DropdownButton<String>(
            value: _sort,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'newest', child: Text('Mới nhất')),
              DropdownMenuItem(value: 'price_asc', child: Text('Giá tăng dần')),
              DropdownMenuItem(
                value: 'price_desc',
                child: Text('Giá giảm dần'),
              ),
            ],
            onChanged: (val) {
              setState(() => _sort = val);
              _load(page: 1, reset: true);
            },
          ),
          const SizedBox(width: 8),
          // hiển thị text nhỏ tóm tắt lọc hiện tại (optional)
          Expanded(
            child: Text(
              _buildFilterSummary(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14,
                color: AppColor.buttonprimaryCol,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openFilterBottomSheet() {
    // tạo bản copy tạm để user chỉnh trong sheet
    String? tempGender = _gender;
    String? tempShape = _shape;
    String? tempType = _type;
    String? tempBrandId = _brandId;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Widget buildChip({
              required String? value,
              required String? groupValue,
              required String label,
              required void Function(String?) onSelected,
            }) {
              final selected =
                  groupValue == value || (groupValue == null && value == null);
              return Padding(
                padding: const EdgeInsets.only(right: 6, bottom: 6),
                child: ChoiceChip(
                  showCheckmark: false,
                  selectedColor: AppColor.buttonprimaryCol,
                  label: Text(
                    label,
                    style: TextStyle(
                      color: selected ? Colors.white : Colors.black,
                    ),
                  ),
                  selected: selected,
                  onSelected: (_) => setModalState(() => onSelected(value)),
                ),
              );
            }

            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // header
                    Row(
                      children: [
                        const Text(
                          'Bộ lọc',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              tempGender = null;
                              tempShape = null;
                              tempType = null;
                            });
                          },
                          child: const Text('Xóa lọc'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // loại (frame/sunglasses)
                    const Text(
                      'Loại sản phẩm',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      children: [
                        buildChip(
                          value: null,
                          groupValue: tempType,
                          label: 'Tất cả',
                          onSelected: (v) => tempType = v,
                        ),
                        buildChip(
                          value: 'frame',
                          groupValue: tempType,
                          label: 'Gọng kính',
                          onSelected: (v) {
                            tempType = v;
                            // 👇 chọn type cụ thể => bỏ brand
                            tempBrandId = null;
                          },
                        ),
                        buildChip(
                          value: 'sunglasses',
                          groupValue: tempType,
                          label: 'Kính mát',
                          onSelected: (v) {
                            tempType = v;
                            // 👇 chọn type cụ thể => bỏ brand
                            tempBrandId = null;
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // giới tính
                    const Text(
                      'Giới tính',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      children: [
                        buildChip(
                          value: null,
                          groupValue: tempGender,
                          label: 'Tất cả',
                          onSelected: (v) => tempGender = v,
                        ),
                        buildChip(
                          value: 'male',
                          groupValue: tempGender,
                          label: 'Nam',
                          onSelected: (v) => tempGender = v,
                        ),
                        buildChip(
                          value: 'female',
                          groupValue: tempGender,
                          label: 'Nữ',
                          onSelected: (v) => tempGender = v,
                        ),
                        buildChip(
                          value: 'unisex',
                          groupValue: tempGender,
                          label: 'Unisex',
                          onSelected: (v) => tempGender = v,
                        ),
                        buildChip(
                          value: 'kids',
                          groupValue: tempGender,
                          label: 'Trẻ em',
                          onSelected: (v) => tempGender = v,
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // kiểu dáng
                    const Text(
                      'Kiểu dáng',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      children: [
                        buildChip(
                          value: null,
                          groupValue: tempShape,
                          label: 'Mọi dáng',
                          onSelected: (v) => tempShape = v,
                        ),
                        buildChip(
                          value: 'square',
                          groupValue: tempShape,
                          label: 'Vuông',
                          onSelected: (v) => tempShape = v,
                        ),
                        buildChip(
                          value: 'round',
                          groupValue: tempShape,
                          label: 'Tròn',
                          onSelected: (v) => tempShape = v,
                        ),
                        buildChip(
                          value: 'rectangle',
                          groupValue: tempShape,
                          label: 'Chữ nhật',
                          onSelected: (v) => tempShape = v,
                        ),
                        // cần thêm gì thì bổ sung tiếp
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Nút áp dụng
                    SizedBox(
                      // width: double.infinity,
                      child: AppButton(
                        content: "Áp dụng",
                        onPressed: () {
                          setState(() {
                            _gender = tempGender;
                            _shape = tempShape;
                            _type = tempType;
                            _brandId = tempBrandId;
                          });
                          _load(page: 1, reset: true, keepQuery: false);
                          Navigator.pop(context);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  String _buildFilterSummary() {
    final parts = <String>[];

    if (_type == 'frame') parts.add('Gọng kính');
    if (_type == 'sunglasses') parts.add('Kính mát');
    if (_gender == 'male') parts.add('Nam');
    if (_gender == 'female') parts.add('Nữ');
    if (_gender == 'unisex') parts.add('Unisex');
    if (_gender == 'kids') parts.add('Trẻ em');
    if (_shape == 'square') parts.add('Vuông');
    if (_shape == 'round') parts.add('Tròn');
    if (_shape == 'rectangle') parts.add('Chữ nhật');

    if (parts.isEmpty) return 'Không có bộ lọc nào';
    return 'Bộ lọc: ${parts.join(" · ")}';
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _page > 1 ? () => _load(page: _page - 1) : null,
            icon: const Icon(Icons.chevron_left),
          ),
          Text('$_page / $_totalPages'),
          IconButton(
            onPressed: _page < _totalPages
                ? () => _load(page: _page + 1)
                : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});
  final ProductListItem product;

  @override
  Widget build(BuildContext context) {
    return ProductCard(
      product: product,
      onTap: () => context.push('/product/${product.productId}'),
    );
  }
}
