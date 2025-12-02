enum ChatSender { user, bot }

class BotMessageModel {
  final String id;
  final ChatSender from;
  final String content;
  final DateTime createdAt;

  const BotMessageModel({
    required this.id,
    required this.from,
    required this.content,
    required this.createdAt,
  });

  Map<String, dynamic> toHistoryJson() {
    return {
      'from': from == ChatSender.user ? 'user' : 'bot',
      'content': content,
    };
  }
}
  