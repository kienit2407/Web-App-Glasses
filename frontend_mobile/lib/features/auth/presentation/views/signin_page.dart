import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/assets/app_icon.dart';
import 'package:frontend_mobile/core/common/app_button.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/di/service_local.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/home/presentation/views/home_page.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class SigninPage extends ConsumerStatefulWidget {
  const SigninPage({super.key});

  @override
  ConsumerState<SigninPage> createState() => _SigninPageState();
}

class _SigninPageState extends ConsumerState<SigninPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _pwdController = TextEditingController();
  bool _isLoading = false;
  bool _hidePwd = false;
  Future<void> _onSignInPressed() async {
    final email = _emailController.text.trim();
    final password = _pwdController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập email và mật khẩu')),
      );
      return;
    }

    try {
      await ref.read(authControllerProvider.notifier).signIn(email, password);

      if (!mounted) return;

      // login ok
      context.go('/home');
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Đăng nhập thất bại: $e')));
    }
  }

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
              Iconsax.arrow_left_2_copy, // Dùng icon arrow của Iconsax cho đồng bộ
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
                child: AppButton(
                  content: _isLoading ? 'Loading...' : 'Sign In',
                  onPressed: _onSignInPressed,
                ),
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
          'Don\'t have an Account?',
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
                MaterialTapTargetSize.shrinkWrap, 
          ),
          onPressed: () {
            context.pushReplacementNamed('signup');
          },
          child: const Text(
            'SIGN UP',
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: () {
              // Tạm thời cũng dùng chung trang đổi mật khẩu
              context.pushNamed('change-password');
            },
            child: Text(
              'Forgot Password?',
              style: TextStyle(
                color: AppColor.textpriCol,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
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
          obscureText: _hidePwd,
          decoration: InputDecoration(
            hint: Text(
              'Password',
              style: TextStyle(color: AppColor.textpriCol),
            ),
            prefixIcon: Icon(Iconsax.lock, color: AppColor.textpriCol),
            suffixIcon: IconButton(
              onPressed: () {
                setState(() {
                  _hidePwd = !_hidePwd;
                });
              },
              icon: Icon(
                _hidePwd ? Iconsax.eye_slash : Iconsax.eye,
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
            'Let’s Sign In.!',
            style: TextStyle(
              color: AppColor.textpriCol,
              fontWeight: FontWeight.w700,
              fontSize: 20,
            ),
          ),
          SizedBox(height: 10),
          Text(
            'Login to Your Account to Continue your Courses',
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
