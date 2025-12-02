
import 'package:frontend_mobile/features/chat/data/models/bot_message.dart';

class BotChatState {
  final List<BotMessageModel> messages;
  final bool isBotTyping;
  final bool isSending;
  final String? error;

  const BotChatState({
    required this.messages,
    required this.isBotTyping,
    required this.isSending,
    this.error,
  });

  factory BotChatState.initial() {
    return const BotChatState(
      messages: [],
      isBotTyping: false,
      isSending: false,
      error: null,
    );
  }

  BotChatState copyWith({
    List<BotMessageModel>? messages,
    bool? isBotTyping,
    bool? isSending,
    String? error,
  }) {
    return BotChatState(
      messages: messages ?? this.messages,
      isBotTyping: isBotTyping ?? this.isBotTyping,
      isSending: isSending ?? this.isSending,
      error: error,
    );
  }
}
