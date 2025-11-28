import 'package:apptomate_custom_checkbox/apptomate_custom_checkbox.dart';
import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/assets/app_icon.dart';
import 'package:frontend_mobile/core/common/app_button.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _pwdController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent, // Nền trong suốt
          elevation: 0, // Bỏ bóng đổ
          leading: IconButton(
            icon: const Icon(
              Iconsax.arrow_left, // Dùng icon arrow của Iconsax cho đồng bộ
              color: AppColor.textpriCol, // Màu đen/xám theo theme text
            ),
            onPressed: () {
              // Kiểm tra xem có thể back được không
              if (context.canPop()) {
                context.pop();
              } else {
                // Nếu không còn trang trước (ví dụ chạy thẳng vào login), về trang chủ hoặc onboarding
                context.go('/');
              }
            },
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              //Title
              _titlePage(),
              const SizedBox(height: 45),
              // TextField For Signing
              _textFieldEmail(context),
              const SizedBox(height: 15),
              _textFieldPwd(context),
              const SizedBox(height: 20),
              _checkBoxConfirm(),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 50),
                child: AppButton(content: 'Sign Up', onPressed: () {}),
              ),
              const SizedBox(height: 20),
              _optSignUp(),
              const SizedBox(height: 20),
              _methodSignUp(),
              const SizedBox(height: 20),
              _moveOnSignIn(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _moveOnSignIn() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          'Already have an Account?',
          style: TextStyle(
            color: AppColor.textpriCol,
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
        const SizedBox(width: 5),
        TextButton(
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: Size(0, 0),
            tapTargetSize:
                MaterialTapTargetSize.shrinkWrap, // 🔹 giảm vùng nhấn
          ),
          onPressed: () {},
          child: const Text(
            'SIGN IN',
            style: TextStyle(
              color: AppColor.buttonprimaryCol,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _methodSignUp() {
    return Row(
      spacing: 25,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _iconMethod(AppIcon.googleIcon, () => {}),
        _iconMethod(AppIcon.apppleIcon, () => {}),
      ],
    );
  }

  Widget _iconMethod(String icons, VoidCallback onPressed) {
    return TextButton(
      onPressed: onPressed,
      child: Container(
        width: 50,
        height: 50,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black45,
              offset: Offset(0, 1),
              blurRadius: 10,
              spreadRadius: -5,
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Center(
          child: Image.asset(icons, width: 20, height: 20, fit: BoxFit.contain),
        ),
      ),
    );
  }

  Widget _optSignUp() {
    return Center(
      child: const Text(
        'Or Continue With',
        style: TextStyle(
          color: AppColor.textpriCol,
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _checkBoxConfirm() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Row(
        children: [
          CustomCheckbox(
            padding: EdgeInsets.zero,
            activeColor: Color(0xff50B748),
            value: true,
            onChanged: (value) {},
          ),
          Text(
            'Agree to Terms & Conditions',
            style: TextStyle(
              color: AppColor.textpriCol,
              fontWeight: FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _textFieldPwd(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25),
      child: Container(
        decoration: BoxDecoration(
          color: Color(0xffFFFFFF),
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black45,
              offset: Offset(0, 1),
              blurRadius: 10,
              spreadRadius: -5,
            ),
          ],
        ),
        child: TextField(
          controller: _pwdController,
          cursorColor: AppColor.textpriCol,
          decoration: InputDecoration(
            hint: Text(
              'Password',
              style: TextStyle(color: AppColor.textpriCol),
            ),
            prefixIcon: Icon(Iconsax.lock, color: AppColor.textpriCol),
            suffixIcon: IconButton(
              onPressed: () {},
              icon: Icon(
                Iconsax.eye_slash,
                color: AppColor.textpriCol,
                size: 20,
              ),
            ),
            border: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(color: AppColor.buttonprimaryCol),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    );
  }

  Widget _textFieldEmail(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25),
      child: Container(
        decoration: BoxDecoration(
          color: Color(0xffFFFFFF),
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black45,
              offset: Offset(0, 1),
              blurRadius: 10,
              spreadRadius: -5,
            ),
          ],
        ),
        child: TextField(
          controller: _emailController,
          cursorColor: AppColor.textpriCol,
          decoration: InputDecoration(
            prefixIcon: Icon(Iconsax.sms, color: AppColor.textpriCol),
            hint: Text('Email', style: TextStyle(color: AppColor.textpriCol)),
            border: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(color: AppColor.buttonprimaryCol),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    );
  }

  Widget _titlePage() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Getting Started.!',
            style: TextStyle(
              color: AppColor.textpriCol,
              fontWeight: FontWeight.w700,
              fontSize: 20,
            ),
          ),
          SizedBox(height: 10),
          Text(
            'Create an Account to Continue your allCourses',
            style: TextStyle(
              color: AppColor.textpriCol,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
