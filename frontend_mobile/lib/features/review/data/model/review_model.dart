class ReviewUser {
  final String id;
  final String displayName;
  final String? avatarUrl;

  ReviewUser({
    required this.id,
    required this.displayName,
    this.avatarUrl,
  });

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

  ReviewImage({
    required this.url,
    this.urlId,
  });

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
    return ReviewModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      user: json['user_id'] != null
          ? ReviewUser.fromJson(json['user_id'] as Map<String, dynamic>)
          : null,
      rating: (json['rating'] as num).toInt(),
      comment: json['comment'] ?? '',
      images: (json['images'] as List<dynamic>? ?? [])
          .map((e) => ReviewImage.fromJson(e as Map<String, dynamic>))
          .toList(),
      videoUrl: json['video_url'],
      isEdited: json['is_edited'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
