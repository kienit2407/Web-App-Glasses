import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:go_router/go_router.dart';

class ChangePasswordPage extends ConsumerStatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  ConsumerState<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends ConsumerState<ChangePasswordPage> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _hideCurrent = true;
  bool _hideNew = true;
  bool _hideConfirm = true;

  bool _submitting = false;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    final current = _currentCtrl.text.trim();
    final newPwd = _newCtrl.text.trim();
    final confirm = _confirmCtrl.text.trim();

    if (current.isEmpty || newPwd.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đầy đủ thông tin')),
      );
      return;
    }

    if (newPwd.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mật khẩu mới phải từ 8 ký tự trở lên')),
      );
      return;
    }

    if (newPwd != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Xác nhận mật khẩu không khớp')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await ref
          .read(profileControllerProvider.notifier)
          .changePassword(
            currentPassword: current,
            newPassword: newPwd,
            confirmPassword: confirm,
          );

      if (!mounted) return;
      setState(() => _submitting = false);

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đổi mật khẩu thành công')));
      context.pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Không đổi được mật khẩu: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đổi mật khẩu'),
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildPasswordField(
              label: 'Mật khẩu hiện tại',
              controller: _currentCtrl,
              obscure: _hideCurrent,
              toggle: () => setState(() => _hideCurrent = !_hideCurrent),
            ),
            const SizedBox(height: 12),
            _buildPasswordField(
              label: 'Mật khẩu mới',
              controller: _newCtrl,
              obscure: _hideNew,
              toggle: () => setState(() => _hideNew = !_hideNew),
            ),
            const SizedBox(height: 12),
            _buildPasswordField(
              label: 'Nhập lại mật khẩu mới',
              controller: _confirmCtrl,
              obscure: _hideConfirm,
              toggle: () => setState(() => _hideConfirm = !_hideConfirm),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColor.buttonprimaryCol,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: _submitting ? null : _onSubmit,
                child: _submitting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Xác nhận',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback toggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      cursorColor: AppColor.buttonprimaryCol,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: AppColor.buttonprimaryCol),
          borderRadius: BorderRadius.circular(8),
        ),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
          onPressed: toggle,
        ),
      ),
    );
  }
}
