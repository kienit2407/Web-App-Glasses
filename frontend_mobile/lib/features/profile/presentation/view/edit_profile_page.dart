import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/assets/app_image.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:permission_handler/permission_handler.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _nameCtrl = TextEditingController(); // tên người dùng hiện tịa
  File? _localAvatar;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final state = ref.read(profileControllerProvider);
    final user = state.user;
    _nameCtrl.text = user?.displayName ?? ''; // mới đầu vào cho
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    // [NOTE 1]: Xác định loại quyền cần xin tùy theo thiết bị
    // Android 13+ (SDK 33) dùng Permission.photos
    // Android cũ (SDK < 33) dùng Permission.storage
    // iOS dùng Permission.photos
    Permission permissionWithType;

    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt <= 32) {
        permissionWithType = Permission.storage;
      } else {
        permissionWithType = Permission.photos;
      }
    } else {
      permissionWithType = Permission.photos;
    }

    // [NOTE 2]: Kiểm tra trạng thái HIỆN TẠI trước khi xin
    // Lý do: Để tránh việc vừa bấm vào đã bắt user vào Cài đặt nếu họ chưa từng từ chối.
    var status = await permissionWithType.status;

    // Nếu trạng thái là 'denied' (Từ chối lần đầu hoặc chưa hỏi bao giờ)
    // -> Thì gọi lệnh request() để hiện bảng hỏi "Cho phép truy cập?" của hệ thống
    if (status.isDenied) {
      status = await permissionWithType.request();
    }

    // [NOTE 3]: Xử lý kết quả sau khi hỏi
    // - isGranted: User chọn "Allow Full Access" (Cho phép tất cả)
    // - isLimited: User chọn "Select Photos" (Chỉ cho phép vài ảnh - iOS 14+/Android 14+)
    if (status.isGranted || status.isLimited) {
      // --- KHU VỰC ĐƯỢC PHÉP CHỌN ẢNH ---
      try {
        // [NOTE 4]: Mở File Picker
        // Lưu ý: Nếu status là 'isLimited', FilePicker sẽ chỉ hiện những ảnh mà user đã chọn trước đó.
        FilePickerResult? picked = await FilePicker.platform.pickFiles(
          type: FileType.image,
          allowMultiple: false,
        );

        if (picked != null && picked.files.isNotEmpty) {
          final filePath = picked.files.single.path;

          // [NOTE 5]: Cắt ảnh (Crop)
          final cropped = await ImageCropper().cropImage(
            sourcePath: filePath!,
            uiSettings: [
              AndroidUiSettings(
                toolbarTitle: 'Cắt ảnh',
                toolbarColor: AppColor.buttonprimaryCol, // Đồng bộ màu app
                toolbarWidgetColor: Colors.white,
                initAspectRatio: CropAspectRatioPreset.square,
                lockAspectRatio: false,
                aspectRatioPresets: [
                  CropAspectRatioPreset.original,
                  CropAspectRatioPreset.square,
                ],
              ),
              IOSUiSettings(
                title: 'Cắt ảnh',
                aspectRatioPresets: [
                  CropAspectRatioPreset.original,
                  CropAspectRatioPreset.square,
                ],
              ),
            ],
          );

          // Cập nhật UI & Gọi API lưu
          if (cropped != null) {
            setState(() {
              _localAvatar = File(cropped.path);
            });
            _saveProfile();
          }
        }
      } catch (e) {
        debugPrint("Lỗi pick file: $e");
      }
      // ------------------------------------
    } else if (status.isPermanentlyDenied) {
      // [NOTE 6]: Trường hợp bị chặn vĩnh viễn (User bấm Don't Allow 2 lần hoặc tắt trong Settings)
      // -> Bắt buộc hiện Dialog dẫn user sang Cài đặt (Settings) của điện thoại
      _showPermissionDialog();
    } else {
      // Trường hợp User bấm "Hủy" hoặc "Không cho phép" ở bảng hỏi lần đầu
      // Có thể hiện SnackBar nhắc nhở nhẹ
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bạn cần cấp quyền để đổi ảnh đại diện')),
      );
    }
  }

  void _showPermissionDialog() {
    // [NOTE 7]: Dùng showAdaptiveDialog
    // Hàm này tự động tạo hiệu ứng Fade/Scale popup đúng chuẩn iOS hoặc Android
    showAdaptiveDialog(
      context: context,
      builder: (ctx) {
        // --- GIAO DIỆN IOS (Cupertino) ---
        if (Platform.isIOS) {
          return CupertinoAlertDialog(
            title: const Text('Cần cấp quyền truy cập'),
            content: const Text(
              'Ứng dụng bị chặn quyền truy cập ảnh. Vui lòng vào Cài đặt > Ảnh > Chọn "Truy cập đầy đủ" hoặc "Giới hạn" để tiếp tục.',
            ),
            actions: [
              CupertinoDialogAction(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Huỷ', style: TextStyle(color: Colors.red)), // Mặc định là màu xanh chuẩn iOS
              ),
              CupertinoDialogAction(
                isDefaultAction: true, // Làm chữ In Đậm (Bold)
                onPressed: () {
                  Navigator.pop(ctx);
                  openAppSettings(); // Mở trang cài đặt
                },
                // [NOTE 8]: Fix màu tím mặc định
                // Thêm textStyle để chỉnh màu nút thành màu xanh (chuẩn iOS) hoặc màu App
                textStyle: const TextStyle(
                  color: Color(0xff007AFF), // Hoặc Colors.blue
                  fontWeight: FontWeight.bold,
                ),
                child: const Text('Đến Cài đặt'),
              ),
            ],
          );
        }

        // --- GIAO DIỆN ANDROID (Material) ---
        return AlertDialog(
          title: const Text('Cần cấp quyền truy cập'),
          content: const Text(
            'Ứng dụng cần quyền truy cập thư viện ảnh để tải lên avatar. Vui lòng vào Cài đặt để cấp quyền.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Huỷ', style: TextStyle(color: Colors.red)),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                openAppSettings();
              },
              // Android tự lấy màu primary của App (AppColor.buttonprimaryCol) nên không cần chỉnh
              child: const Text(
                'Đến Cài đặt',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _saveProfile() async {
    final name = _nameCtrl.text.trim();

    print(name);
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
      // context.pop(); // quay về trang Account
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
    final isUploadingAvt = false;
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
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        actions: [
          TextButton(
            style: TextButton.styleFrom(disabledBackgroundColor: Colors.grey),
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
                colors: [
                  Color(0xff251E4C),
                  Color(0xff341D5C),
                  Color(0xff6B2E7C),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              image: const DecorationImage(
                image: AssetImage(AppImage.nitro1),
                fit: BoxFit.fill,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    GestureDetector(
                      onTap: _pickAvatar,
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.white,
                        backgroundImage: avatarProvider,
                        child: (avatarProvider == null
                                  ? Text(
                                      _initials(
                                        user?.displayName ?? user?.email ?? 'U',
                                      ),
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    )
                                  : null),
                      ),
                    ),
                    Positioned(
                      top: -10,
                      left: -9,
                      child: IgnorePointer(
                        child: Image.asset(
                          AppImage.avtFrame2,
                          width: 100,
                          height: 100,
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
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
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
            Expanded(child: Text(title, style: const TextStyle(fontSize: 13))),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
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
                          setState(() {
                            _nameCtrl.text = v;
                          });
                          _saveProfile();
                          Navigator.pop(ctx);
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

class CropAspectRatioPresetCustom implements CropAspectRatioPresetData {
  @override
  (int, int)? get data => (2, 3);

  @override
  String get name => '2x3 (customized)';
}
