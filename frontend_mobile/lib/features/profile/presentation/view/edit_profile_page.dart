import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _nameCtrl = TextEditingController();
  File? _localAvatar;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final state = ref.read(profileControllerProvider);
    final user = state.user;
    _nameCtrl.text = user?.displayName ?? '';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        _localAvatar = File(picked.path);
      });
    }
  }

  Future<void> _saveProfile() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Vui lòng nhập tên')));
      return;
    }

    setState(() => _saving = true);
    try {
      await ref
          .read(profileControllerProvider.notifier)
          .updateProfile(displayName: name, avatarFile: _localAvatar);

      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cập nhật thông tin thành công')),
      );
      context.pop(); // quay về trang Account
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Không thể cập nhật: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileControllerProvider);
    final user = state.user;

    // final avatarProvider = (() {
    //   if (_localAvatar != null) return FileImage(_localAvatar!);
    //   if (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty) {
    //     return NetworkImage(user.avatarUrl!);
    //   }
    //   return null;
    // })();
    final ImageProvider<Object>? avatarProvider = _localAvatar != null
        ? FileImage(_localAvatar!)
        : (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty
              ? NetworkImage(user.avatarUrl!)
              : null);

    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      appBar: AppBar(
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Chỉnh sửa trang cá nhân',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : _saveProfile,
            child: Text(
              'Lưu',
              style: TextStyle(
                color: _saving ? Colors.grey : AppColor.buttonprimaryCol,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // --- HEADER ĐỎ + AVATAR ---
          Container(
            width: double.infinity,
            height: 180,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xfff9735b), Color(0xfffdc46b)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              image: const DecorationImage(
                image: AssetImage(AppImage.bgProfile),
                fit: BoxFit.cover,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white,
                      backgroundImage: avatarProvider,
                      child: avatarProvider == null
                          ? Text(
                              _initials(
                                user?.displayName ?? user?.email ?? 'U',
                              ),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    Positioned(
                      bottom: -10,
                      left: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickAvatar,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Edit',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // --- FORM DẠNG LIST ---
          Expanded(
            child: ListView(
              children: [
                const SizedBox(height: 12),
                _buildSectionHeader('Thông tin cơ bản'),
                _buildEditableRow(
                  title: 'Tên hiển thị',
                  value: _nameCtrl.text.isEmpty
                      ? 'Cài đặt ngay'
                      : _nameCtrl.text,
                  onTap: () async {
                    final result = await _showEditNameDialog(
                      context,
                      initial: _nameCtrl.text,
                    );
                    if (result != null) {
                      setState(() {
                        _nameCtrl.text = result;
                      });
                    }
                  },
                ),
                const SizedBox(height: 24),
                _buildSectionHeader('Personal information'),
                _buildStaticRow(
                  title: 'Email',
                  value: user?.email ?? '',
                  valueColor: Colors.black87,
                  showArrow: false,
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.red),
                        foregroundColor: Colors.red,
                      ),
                      onPressed: () {
                        context.pushNamed('change-password');
                      },
                      child: const Text(
                        'Đổi mật khẩu',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      width: double.infinity,
      color: const Color(0xfff5f5f5),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          color: Colors.grey,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildEditableRow({
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return _buildStaticRow(title: title, value: value, onTap: onTap);
  }

  Widget _buildStaticRow({
    required String title,
    required String value,
    Color? valueColor,
    VoidCallback? onTap,
    bool showArrow = true,
  }) {
    final isPlaceholder = value.toLowerCase() == 'set now';

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: Color(0xffeeeeee), width: 0.8),
          ),
        ),
        child: Row(
          children: [
            Expanded(child: Text(title, style: const TextStyle(fontSize: 15))),
            Text(
              value,
              style: TextStyle(
                fontSize: 15,
                color:
                    valueColor ??
                    (isPlaceholder ? Colors.grey : Colors.black87),
              ),
            ),
            if (showArrow && onTap != null) ...[
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
            ],
          ],
        ),
      ),
    );
  }

  Future<String?> _showEditNameDialog(
    BuildContext context, {
    required String initial,
  }) async {
    final ctrl = TextEditingController(text: initial);

    return showDialog<String>(
      context: context,
      // Cho phép bấm ra ngoài để tắt nếu muốn (hoặc false để bắt buộc chọn)
      barrierDismissible: true,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min, // Co gọn theo nội dung
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Tiêu đề
                const Center(
                  child: Text(
                    'Đổi tên hiển thị',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // 2. Ô nhập liệu đẹp hơn
                TextField(
                  controller: ctrl,
                  autofocus: true,
                  cursorColor: AppColor.buttonprimaryCol,
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Nhập tên của bạn',
                    hintStyle: TextStyle(color: Colors.grey.shade400),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    isDense: true,
                    // Viền khi bình thường
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    // Viền khi focus (Màu chính)
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: AppColor.buttonprimaryCol,
                        width: 1.5,
                      ),
                    ),
                    // Icon xoá nhanh (Optional)
                    suffixIcon: IconButton(
                      icon: const Icon(
                        Icons.close,
                        size: 20,
                        color: Colors.grey,
                      ),
                      onPressed: () => ctrl.clear(),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // 3. Hàng nút bấm (Huỷ - Lưu)
                Row(
                  children: [
                    // Nút Huỷ (Màu xám)
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          foregroundColor: Colors.grey.shade600,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Huỷ',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Nút Lưu (Màu chính - Nổi bật)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final v = ctrl.text.trim();
                          if (v.isEmpty) return;
                          Navigator.pop(ctx, v);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColor.buttonprimaryCol,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Lưu',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }
}
