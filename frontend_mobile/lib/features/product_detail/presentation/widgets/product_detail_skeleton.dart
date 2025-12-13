import 'package:flutter/material.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';

class ProductDetailSkeleton extends StatelessWidget {
  const ProductDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Skeletonizer(
      enabled: true,
      child: Scaffold(
        backgroundColor: const Color(0xfff5f5f5),
        appBar: AppBar(
          backgroundColor: AppColor.buttonprimaryCol,
          foregroundColor: Colors.white,
          // Sửa lỗi: Thay Bone.text bằng Bone để set width/height
          title: const Bone(width: 150, height: 20),
          actions: const [
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              // Sửa lỗi: Bỏ tham số color, chỉ giữ size
              child: Bone.icon(size: 24),
            ),
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ===== 1. GALLERY SKELETON =====
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    // Ảnh lớn
                    const AspectRatio(
                      aspectRatio: 1,
                      child: Bone(
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Hàng ảnh nhỏ
                    SizedBox(
                      height: 60,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: 5,
                        separatorBuilder: (_, __) => const SizedBox(width: 6),
                        itemBuilder: (context, index) {
                          return const Bone(
                            width: 60,
                            height: 60,
                            borderRadius: BorderRadius.all(Radius.circular(6)),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ===== 2. INFO SKELETON =====
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Dòng: Mã SKU + Đã bán
                    Row(
                      children: [
                        const Bone(
                          width: 80,
                          height: 20,
                          borderRadius: BorderRadius.all(Radius.circular(4)),
                        ),
                        const SizedBox(width: 6),
                        const Bone(
                          width: 60,
                          height: 20,
                          borderRadius: BorderRadius.all(Radius.circular(4)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Tên sản phẩm
                    const Bone.multiText(
                      lines: 2,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Rating (Sửa lỗi width trong TextStyle)
                    const Row(
                      children: [
                        Bone.icon(size: 16),
                        SizedBox(width: 4),
                        // Thay Bone.text bằng Bone để chỉnh width
                        Bone(width: 30, height: 14),
                        SizedBox(width: 8),
                        Bone(width: 80, height: 14),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Giá tiền
                    const Bone(width: 150, height: 24),

                    const SizedBox(height: 12),

                    // Chọn biến thể
                    const Bone(width: 100, height: 16),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: List.generate(
                        3,
                        (index) => const Bone(
                          width: 80,
                          height: 32,
                          borderRadius: BorderRadius.all(Radius.circular(20)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ===== 3. TABS SKELETON =====
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                height: 300,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tab Bar giả
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: List.generate(
                        3,
                        (index) => const Bone(width: 60, height: 16),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    // Nội dung mô tả
                    const Bone.multiText(lines: 6),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ===== 4. BOTTOM BAR SKELETON =====
        bottomNavigationBar: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          color: Colors.white,
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                // Nút +/- số lượng
                const Bone(
                  width: 100,
                  height: 40,
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
                const SizedBox(width: 12),

                // Nút Thêm giỏ
                const Expanded(
                  child: Bone(
                    height: 45,
                    borderRadius: BorderRadius.all(Radius.circular(8)),
                  ),
                ),
                const SizedBox(width: 8),

                // Nút Mua ngay
                const Expanded(
                  child: Bone(
                    height: 45,
                    borderRadius: BorderRadius.all(Radius.circular(8)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
