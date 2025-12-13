class ReviewUser {
  final String id;
  final String displayName;
  final String? avatarUrl;

  ReviewUser({required this.id, required this.displayName, this.avatarUrl});

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      displayName: json['display_name'] ?? 'Người dùng',
      avatarUrl: json['avatar_url'],
    );
  }
}

class ReviewImage {
  final String url;
  final String? urlId;

  ReviewImage({required this.url, this.urlId});

  factory ReviewImage.fromJson(Map<String, dynamic> json) {
    return ReviewImage(
      url: json['url'] as String,
      urlId: json['url_id'] as String?,
    );
  }
}

class ReviewModel {
  final String id;
  final ReviewUser? user;
  final int rating;
  final String comment;
  final List<ReviewImage> images;
  final String? videoUrl;
  final bool isEdited;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.user,
    required this.rating,
    required this.comment,
    required this.images,
    required this.videoUrl,
    required this.isEdited,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    // XỬ LÝ USER AN TOÀN
    ReviewUser? parsedUser;
    if (json['user_id'] is Map<String, dynamic>) {
      // Trường hợp 1: Backend trả về object user đầy đủ (thường là khi GET)
      parsedUser = ReviewUser.fromJson(json['user_id']);
    } else if (json['user_id'] is String) {
      // Trường hợp 2: Backend chỉ trả về ID dạng chuỗi (thường là khi POST/CREATE)
      parsedUser = ReviewUser(
        id: json['user_id'],
        displayName:
            'Tôi', // Tạm thời để tên mặc định vì server chưa trả về tên
        avatarUrl: null,
      );
    }

    return ReviewModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      user: parsedUser,
      rating: (json['rating'] as num).toInt(),
      comment: json['comment'] ?? '',
      // XỬ LÝ ẢNH AN TOÀN HƠN
      images: (json['images'] as List<dynamic>? ?? []).map((e) {
        if (e is Map<String, dynamic>) {
          return ReviewImage.fromJson(e);
        } else if (e is String) {
          // Đề phòng server trả về mảng string url ["http...", "http..."]
          return ReviewImage(url: e);
        }
        return ReviewImage(url: '');
      }).toList(),
      videoUrl: json['video_url'],
      isEdited: json['is_edited'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
