import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.content,
    required this.onPressed,
    this.isLoading = false, // Thêm tùy chọn loading nếu cần
  });

  final String content;
  final VoidCallback onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity, // Đảm bảo nút luôn full chiều ngang
      height: 56, // Chiều cao cố định cho nút đẹp hơn
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          // Padding ngang = 0 để ta tự căn chỉnh bên trong Stack
          padding: const EdgeInsets.symmetric(horizontal: 8), 
          foregroundColor: Colors.white,
          backgroundColor: AppColor.buttonprimaryCol,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
          elevation: 0,
        ),
        onPressed: isLoading ? null : onPressed,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // 1. Text nằm chính giữa tuyệt đối
            Align(
              alignment: Alignment.center,
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      content,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
            ),

            // 2. Icon nằm sát bên phải
            if (!isLoading)
              Align(
                alignment: Alignment.centerRight,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Iconsax.arrow_right_1_copy, // Đổi icon cho khớp style
                      size: 20,
                      color: AppColor.buttonprimaryCol,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}