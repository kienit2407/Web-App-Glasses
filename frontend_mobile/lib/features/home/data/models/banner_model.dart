class BannerModel {
  final String id;
  final String imageUrl;
  final int position;

  BannerModel({
    required this.id,
    required this.imageUrl,
    required this.position,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['_id']?.toString() ?? '',
      imageUrl: json['banner_url'] as String? ?? '',
      position: (json['position'] as num?)?.toInt() ?? 0,
    );
  }
}
