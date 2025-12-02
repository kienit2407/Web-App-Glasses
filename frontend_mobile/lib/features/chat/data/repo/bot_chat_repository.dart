import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/chat/data/models/bot_message.dart';
import 'package:frontend_mobile/features/chat/data/models/chat_response_model.dart';


class BotChatRepository {
  final DioClient dioClient;

  BotChatRepository({required this.dioClient});

  Future<ChatResponseModel> sendMessage({
    required String message,
    required List<BotMessageModel> history,
  }) async {
    // map history -> format backend đang dùng: { from, content }
    final historyJson =
        history.map((m) => m.toHistoryJson()).toList(growable: false);

    final res = await dioClient.dio.post(
      '/trap-bot/chat',
      data: {
        'message': message,
        'history': historyJson,
      },
    );

    // backend: { data: { intent, answer } }
    final data = res.data['data'] as Map<String, dynamic>;
    return ChatResponseModel.fromJson(data);
  }
}
