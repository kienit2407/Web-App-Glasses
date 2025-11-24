class BrandModel {
  final String id;
  final String name;
  final String? logoUrl;

  BrandModel({required this.id, required this.name, this.logoUrl});

  factory BrandModel.fromJson(Map<String, dynamic> json) {
    return BrandModel(
      id: json['_id']?.toString() ?? '',
      name: json['brand_name'] as String? ?? '',
      logoUrl: json['logo_url'] as String?,
    );
  }
}
