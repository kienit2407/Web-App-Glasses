
import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';


class AppButton extends StatelessWidget {
  const AppButton({super.key, required this.content, required this.onPressed});
  final String content;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        padding: EdgeInsets.only(top: 5, bottom: 5, left: 20, right: 5),
        foregroundColor: Colors.white,
        backgroundColor: AppColor.buttonprimaryCol,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50))
      ),
      onPressed: onPressed,
      child: Row(
        // mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            content,
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(width: 15),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle
            ),
            child: Center(child: Icon(Iconsax.arrow, size: 20, color: AppColor.buttonprimaryCol, fontWeight: FontWeight.w600,))
          )
        ],
      ),
    );
  }
}
