import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart'; // Import theme màu của bạn
import 'package:frontend_mobile/features/chat/data/models/bot_message.dart';
import 'package:frontend_mobile/features/chat/presentation/viewmodel/bot_chat_state.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

class BotChatPage extends ConsumerStatefulWidget {
  const BotChatPage({super.key});

  @override
  ConsumerState<BotChatPage> createState() => _BotChatPageState();
}

class _BotChatPageState extends ConsumerState<BotChatPage> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutQuad,
    );
  }

  Future<void> _handleSend() async {
    final text = _inputController.text;
    if (text.trim().isEmpty) return;

    _inputController.clear();
    // Gửi tin nhắn -> Riverpod xử lý
    await ref.read(botChatControllerProvider.notifier).sendUserMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final BotChatState state = ref.watch(botChatControllerProvider);

    // Lắng nghe lỗi
    ref.listen<BotChatState>(botChatControllerProvider, (prev, next) {
      if (next.error != null && next.error!.isNotEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: ${next.error}')));
        ref.read(botChatControllerProvider.notifier).clearError();
      }
    });

    return Scaffold(
      backgroundColor: Colors.white, // Nền trắng sạch giống Messenger
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColor.buttonprimaryCol),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            const CircleAvatar(
              radius: 18,
              backgroundColor: AppColor.buttonprimaryCol,
              child: Icon(
                Iconsax.message_question,
                size: 20,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Trợ lý AI',
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  state.isBotTyping ? 'Đang trả lời...' : 'Sẵn sàng hỗ trợ',
                  style: TextStyle(
                    color: state.isBotTyping
                        ? AppColor.buttonprimaryCol
                        : Colors.grey,
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ],
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // ===== DANH SÁCH TIN NHẮN =====
          Expanded(
            child: GestureDetector(
              onTap: () =>
                  FocusScope.of(context).unfocus(), // Chạm ra ngoài ẩn phím
              child: state.messages.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      controller: _scrollController,
                      reverse: true, // List đảo ngược (Mới nhất ở dưới)
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 20,
                      ),
                      // +1 item cho typing indicator nếu đang type
                      itemCount:
                          state.messages.length + (state.isBotTyping ? 1 : 0),
                      itemBuilder: (context, index) {
                        // Nếu đang typing -> Item đầu tiên (index 0) là Typing Indicator
                        if (state.isBotTyping && index == 0) {
                          return const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: _TypingIndicator(),
                          );
                        }

                        // Tính lại index thật trong mảng messages
                        final msgIndex = state.isBotTyping ? index - 1 : index;
                        final message = state.messages[msgIndex];

                        // Kiểm tra tin nhắn trước/sau để bo góc đẹp hơn (nhóm tin nhắn)
                        final isUser = message.from == ChatSender.user;
                        final isNextSameAuthor =
                            (msgIndex + 1 < state.messages.length) &&
                            (state.messages[msgIndex + 1].from == message.from);

                        return _MessageBubble(
                          message: message,
                          isUser: isUser,
                          isLastInGroup:
                              !isNextSameAuthor, // Nếu tin tiếp theo khác người gửi -> Đây là tin cuối nhóm -> Hiện avatar/bo góc
                        );
                      },
                    ),
            ),
          ),

          // ===== THANH NHẬP LIỆU =====
          _buildInputArea(context, state.isSending),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColor.buttonprimaryCol.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Iconsax.message_text,
              size: 40,
              color: AppColor.buttonprimaryCol,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Xin chào! Tôi là trợ lý ảo AI.',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Hãy hỏi tôi về cách chọn kính,\ntư vấn khuôn mặt hoặc sản phẩm nhé.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(BuildContext context, bool isSending) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 10,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            // Nút tiện ích (Optional - ví dụ gửi ảnh)
            IconButton(
              icon: const Icon(
                Icons.add_circle,
                size: 28,
                color: AppColor.buttonprimaryCol,
              ),
              onPressed: () {}, // TODO: Tính năng gửi ảnh sau này
            ),

            // Ô nhập liệu
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  textInputAction: TextInputAction.done,
                  cursorColor: AppColor.buttonprimaryCol,
                  controller: _inputController,
                  textCapitalization: TextCapitalization.sentences,
                  minLines: 1,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText: 'Nhập tin nhắn...',
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                  ),
                  onSubmitted: (value) {
                    print("Người dùng đã nhập xong: $value");
                    // Thường là ẩn bàn phím hoặc gửi dữ liệu
                    FocusScope.of(context).unfocus();
                  },
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Nút Gửi
            isSending
                ? const SizedBox(
                    width: 40,
                    height: 40,
                    child: Padding(
                      padding: EdgeInsets.all(10),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    icon: const Icon(
                      Iconsax.send_2,
                      size: 28,
                      color: AppColor.buttonprimaryCol,
                    ),
                    onPressed: _handleSend,
                  ),
          ],
        ),
      ),
    );
  }
}

// --- WIDGET BONG BÓNG CHÁT RIÊNG ---
class _MessageBubble extends StatelessWidget {
  final BotMessageModel message;
  final bool isUser;
  final bool isLastInGroup;

  const _MessageBubble({
    required this.message,
    required this.isUser,
    required this.isLastInGroup,
  });

  @override
  Widget build(BuildContext context) {
    // Màu sắc bubble
    final color = isUser ? AppColor.buttonprimaryCol : const Color(0xFFE4E6EB);
    final textColor = isUser ? Colors.white : Colors.black;

    // Bo góc (Messenger style: Các tin liên tiếp của cùng 1 người sẽ bo ít hơn)
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(18),
      topRight: const Radius.circular(18),
      bottomLeft: isUser
          ? const Radius.circular(18)
          : (isLastInGroup
                ? const Radius.circular(4)
                : const Radius.circular(4)), // Bot: Góc dưới trái nhọn
      bottomRight: !isUser
          ? const Radius.circular(18)
          : (isLastInGroup
                ? const Radius.circular(4)
                : const Radius.circular(4)), // User: Góc dưới phải nhọn
    );

    return Padding(
      padding: EdgeInsets.only(
        bottom: isLastInGroup ? 12 : 2,
      ), // Nhóm tin cách xa, tin trong nhóm sát nhau
      child: Row(
        mainAxisAlignment: isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar Bot (Chỉ hiện ở tin cuối cùng của nhóm)
          if (!isUser) ...[
            if (isLastInGroup)
              const CircleAvatar(
                radius: 14,
                backgroundColor: AppColor.buttonprimaryCol,
                child: Icon(
                  Iconsax.android,
                  size: 16,
                  color: Colors.white,
                ),
              )
            else
              const SizedBox(width: 28), // Placeholder để thẳng hàng
            const SizedBox(width: 8),
          ],

          // Bubble nội dung
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: color,
                borderRadius: borderRadius,
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: textColor,
                  fontSize: 15,
                  height: 1.4, // Line height dễ đọc
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- WIDGET HIỆU ỨNG TYPING (3 chấm nhảy) ---
class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Avatar Bot
        const CircleAvatar(
          radius: 14,
          backgroundColor: AppColor.buttonprimaryCol,
          child: Icon(Iconsax.message_question, size: 16, color: Colors.white),
        ),
        const SizedBox(width: 8),

        // Bubble chứa 3 chấm
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFE4E6EB),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (index) {
              return FadeTransition(
                opacity: _controller.drive(
                  TweenSequence([
                    TweenSequenceItem(
                      tween: Tween(begin: 0.4, end: 1.0),
                      weight: 20,
                    ),
                    TweenSequenceItem(
                      tween: Tween(begin: 1.0, end: 0.4),
                      weight: 20,
                    ),
                    TweenSequenceItem(tween: ConstantTween(0.4), weight: 60),
                  ]).chain(CurveTween(curve: Interval(index * 0.2, 1.0))),
                ),
                child: Container(
                  width: 6,
                  height: 6,
                  margin: EdgeInsets.only(right: index < 2 ? 4 : 0),
                  decoration: const BoxDecoration(
                    color: Colors.grey,
                    shape: BoxShape.circle,
                  ),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
