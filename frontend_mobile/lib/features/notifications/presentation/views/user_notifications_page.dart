// lib/features/notifications/presentation/views/user_notifications_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/notifications/data/models/user_notification_model.dart';
import 'package:intl/intl.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:go_router/go_router.dart';

final _timeFormat = DateFormat('dd/MM/yyyy HH:mm');

class UserNotificationsPage extends ConsumerWidget {
  const UserNotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(userNotificationControllerProvider);
    final controller = ref.read(userNotificationControllerProvider.notifier);

    
    final authState = ref.watch(authControllerProvider);
    final authUser = authState.valueOrNull;

    // Nếu chưa đăng nhập -> hiển thị giao diện guest
    if (authUser == null) {
      return _buildGuestAccount(context);
    }
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        title: const Text(
          'Thông báo',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        actions: [
          if (state.items.isNotEmpty)
            Row(
              children: [
                TextButton(
                  onPressed: () => controller.markAllRead(),
                  child: const Text(
                    'Đọc hết',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) {
                        return AlertDialog(
                          title: const Text('Xoá tất cả thông báo?'),
                          content: const Text(
                            'Thao tác này sẽ xoá toàn bộ thông báo hiện có, bạn có chắc không?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(false),
                              child: const Text('Huỷ', style: TextStyle(color: AppColor.textpriCol),),
                            ),
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(true),
                              child: const Text(
                                'Xoá hết',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        );
                      },
                    );

                    if (confirm == true) {
                      await controller.deleteAll();
                    }
                  },
                  child: const Text(
                    'Xoá hết',
                    style: TextStyle(
                      color: Colors.red, // chữ đỏ
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator.adaptive())
          : RefreshIndicator.adaptive(
              onRefresh: () => controller.refresh(),
              child: state.items.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(
                          child: Text(
                            'Chưa có thông báo nào',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.black54,
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 120),
                      itemCount: state.items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 4),
                      itemBuilder: (context, index) {
                        final item = state.items[index];
                        return _NotificationTile(item: item);
                      },
                    ),
            ),
    );
  }

  Widget _buildGuestAccount(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xfff5f5f5),
      appBar: AppBar(
        title: const Text(
          'Thông báo',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_outline, size: 80, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Bạn chưa đăng nhập',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Đăng nhập để xem đơn hàng, voucher và quản lý tài khoản.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              // 2 nút nằm NGANG nhau
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColor.buttonprimaryCol),
                        foregroundColor: AppColor.buttonprimaryCol,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => context.goNamed('signup'),
                      child: const Text('Đăng ký'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => context.goNamed('signin'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColor.buttonprimaryCol,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Đăng nhập'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.item});

  final UserNotification item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(userNotificationControllerProvider.notifier);

    Future<void> onTap() async {
      await controller.markRead(item);

      if (item.meta.orderId != null) {
        context.pushNamed(
          'order-detail',
          pathParameters: {'id': item.meta.orderId.toString()},
        );
      } else {
        context.goNamed('orders');
      }
    }

    Future<void> onDelete() async {
      await controller.deleteOne(item);
    }

    return Slidable(
      key: ValueKey(item.id),
      endActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.25,
        children: [
          SlidableAction(
            onPressed: (_) => onDelete(),
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            icon: Icons.delete_outline,
            label: 'Xoá',
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: item.isRead ? Colors.white : const Color(0xffF1F5F9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: item.isRead
                  ? Colors.grey.shade200
                  : AppColor.buttonprimaryCol.withOpacity(0.3),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAvatar(),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (!item.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 4),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.blue,
                            ),
                          ),
                        Expanded(
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _timeFormat.format(item.createdAt),
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (item.thumbnailUrl != null && item.thumbnailUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          item.thumbnailUrl!,
          width: 44,
          height: 44,
          fit: BoxFit.cover,
        ),
      );
    }
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColor.buttonprimaryCol.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(
        Iconsax.box_1,
        color: AppColor.buttonprimaryCol,
        size: 22,
      ),
    );
  }
}
