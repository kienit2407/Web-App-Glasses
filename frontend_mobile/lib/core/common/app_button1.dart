// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:flutter/material.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    Key? key,
    required this.label,
    required this.onPressed,
    this.height,
    this.width,
    this.color,
    this.textColor,
  }) : super(key: key);
  final String label;
  final VoidCallback onPressed;
  final double? height;
  final double? width;
  final Color? color;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    // Responsive: dùng MediaQuery nếu không truyền width/height
    final buttonWidth = width ?? MediaQuery.of(context).size.width * 0.8;
    final buttonHeight = height ?? 56.0;

    return SizedBox(
      width: buttonWidth,
      height: buttonHeight,
      child: ElevatedButton(
        onPressed: onPressed, 
        child: Text(label),
      ),
    );
  }
}
