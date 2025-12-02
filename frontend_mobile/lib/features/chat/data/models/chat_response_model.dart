enum ChatIntent { order, product, faceAdvice, smalltalk }

class ChatResponseModel {
  final ChatIntent intent;
  final String answer;

  ChatResponseModel({required this.intent, required this.answer});

  factory ChatResponseModel.fromJson(Map<String, dynamic> json) {
    final intentStr = json['intent'] as String? ?? 'smalltalk';
    final answer = json['answer'] as String? ?? '';

    ChatIntent intent;
    switch (intentStr) {
      case 'order':
        intent = ChatIntent.order;
        break;
      case 'product':
        intent = ChatIntent.product;
        break;
      case 'face_advice':
        intent = ChatIntent.faceAdvice;
        break;
      default:
        intent = ChatIntent.smalltalk;
    }

    return ChatResponseModel(intent: intent, answer: answer);
  }
}
