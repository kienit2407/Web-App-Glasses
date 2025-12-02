import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/features/chat/data/models/bot_message.dart';
import 'package:frontend_mobile/features/chat/data/repo/bot_chat_repository.dart';
import 'package:frontend_mobile/features/chat/presentation/viewmodel/bot_chat_state.dart';

class BotChatController extends StateNotifier<BotChatState> {
  final BotChatRepository _repo;

  BotChatController(this._repo) : super(BotChatState.initial());

  Future<void> sendUserMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isSending) return;

    final now = DateTime.now();

    // Thêm message user xuống “dưới” (vì ListView.reverse = true nên insert(0))
    final userMsg = BotMessageModel(
      id: 'user-${now.millisecondsSinceEpoch}',
      from: ChatSender.user,
      content: trimmed,
      createdAt: now,
    );

    state = state.copyWith(
      messages: [userMsg, ...state.messages],
      isSending: true,
      isBotTyping: true,
      error: null,
    );

    try {
      // gửi history theo thứ tự cũ -> mới cho backend
      final historyForApi = state.messages.reversed.toList();

      final resp = await _repo.sendMessage(
        message: trimmed,
        history: historyForApi,
      );

      final botMsg = BotMessageModel(
        id: 'bot-${DateTime.now().millisecondsSinceEpoch}',
        from: ChatSender.bot,
        content: resp.answer,
        createdAt: DateTime.now(),
      );

      state = state.copyWith(
        messages: [botMsg, ...state.messages],
        isSending: false,
        isBotTyping: false,
      );
    } catch (e) {
      state = state.copyWith(
        isSending: false,
        isBotTyping: false,
        error: e.toString(),
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
