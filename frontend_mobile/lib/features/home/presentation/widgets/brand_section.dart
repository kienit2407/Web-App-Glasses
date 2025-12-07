import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/home/data/models/brand_model.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class BrandSection extends StatefulWidget {
  const BrandSection({super.key, required this.brands});
  final List<BrandModel> brands;
  @override
  State<BrandSection> createState() => _MovieSectionWithScrollState();
}

class _MovieSectionWithScrollState extends State<BrandSection> {
  // 1. Khai báo biến Ở ĐÂY (Trong State, không phải trong hàm build)
  late ScrollController _scrollController;
  double _scrollPercent = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();

    // 2. Lắng nghe sự kiện cuộn
    _scrollController.addListener(() {
      if (_scrollController.hasClients) {
        final maxScroll = _scrollController.position.maxScrollExtent;
        final currentScroll = _scrollController.offset;

        // Tính toán tỷ lệ
        double percent = maxScroll > 0 ? (currentScroll / maxScroll) : 0.0;
        percent = percent.clamp(0.0, 1.0);

        // Chỉ setState nếu giá trị thay đổi đáng kể (để tối ưu hiệu năng)
        if ((_scrollPercent - percent).abs() > 0.01) {
          setState(() {
            _scrollPercent = percent;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    // 3. Nhớ dispose controller để tránh rò rỉ bộ nhớ
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      spacing: 10,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 100,
          child: ListView.separated(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            scrollDirection: Axis.horizontal,
            itemCount: widget.brands.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final brand = widget.brands[index];
              return GestureDetector(
                onTap: () {
                  context.pushNamed(
                    'search-result',
                    extra: {
                      'query': '', // không filter q
                      'gender': null,
                      'shape': null,
                      'type':
                          null, // nếu muốn cố định "gọng kính" thì để 'frame'
                      'brandId': brand.id,
                    },
                  );
                },

                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child:
                            brand.logoUrl != null && brand.logoUrl!.isNotEmpty
                            ? Image.network(brand.logoUrl!, fit: BoxFit.contain)
                            : Center(
                                child: Text(
                                  brand.name.isNotEmpty
                                      ? brand.name[0].toUpperCase()
                                      : 'B',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: 70,
                      child: Text(
                        brand.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        // --- INDICATOR (THANH CUỘN) ---
        Center(
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
            child: Stack(
              children: [
                Positioned(
                  // Công thức: Tỷ lệ * (Độ dài thanh xám - Độ dài thanh đỏ)
                  left: _scrollPercent * (40 - 15),
                  child: Container(
                    width: 15,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColor.buttonprimaryCol,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
