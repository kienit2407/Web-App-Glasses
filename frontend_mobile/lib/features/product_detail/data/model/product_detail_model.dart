// lib/features/product_detail/data/models/product_detail_model.dart

class VariantModel {
  final String variantId;
  final String sku;
  final String frameMaterial;
  final String frameColor;
  final String frameShape;
  final String lensWidth;
  final String lensHeight;
  final String templeLength;
  final String bridgeWidth;
  final int stock;
  final bool hasUvProtection;
  final int price;
  final int? salePrice;

  VariantModel({
    required this.variantId,
    required this.sku,
    required this.frameMaterial,
    required this.frameColor,
    required this.frameShape,
    required this.lensWidth,
    required this.lensHeight,
    required this.templeLength,
    required this.bridgeWidth,
    required this.stock,
    required this.hasUvProtection,
    required this.price,
    required this.salePrice,
  });

  factory VariantModel.fromJson(Map<String, dynamic> json) {
    return VariantModel(
      variantId: json['variant_id'] as String? ?? '',
      sku: json['sku_variant'] as String? ?? '',
      frameMaterial: json['frame_material'] as String? ?? '',
      frameColor: json['frame_color'] as String? ?? '',
      frameShape: json['frame_shape'] as String? ?? '',
      lensWidth: json['lens_width'] as String? ?? '',
      lensHeight: json['lens_height'] as String? ?? '',
      templeLength: json['temple_length'] as String? ?? '',
      bridgeWidth: json['bridge_width'] as String? ?? '',
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      hasUvProtection: json['has_uv_protection'] as bool? ?? false,
      price: (json['price'] as num?)?.toInt() ?? 0,
      salePrice: (json['sale_price'] as num?)?.toInt(),
    );
  }
}

class DetailImage {
  final String imageId;
  final String url;
  final String urlId;
  final int position;

  DetailImage({
    required this.imageId,
    required this.url,
    required this.urlId,
    required this.position,
  });

  factory DetailImage.fromJson(Map<String, dynamic> json) {
    return DetailImage(
      imageId: json['image_id'] as String? ?? '',
      url: json['url'] as String? ?? '',
      urlId: json['url_id'] as String? ?? '',
      position: (json['position'] as num?)?.toInt() ?? 0,
    );
  }
}

class ProductInfo {
  final String productId;
  final String name;
  final String slug;
  final String description;
  final int selledAmount;
  final int reviewCount;
  final double ratingAvg;
  final String? originCountry;
  final String? thumbnailUrl;
  final List<String> tags;

  ProductInfo({
    required this.productId,
    required this.name,
    required this.slug,
    required this.description,
    required this.selledAmount,
    required this.reviewCount,
    required this.ratingAvg,
    required this.originCountry,
    required this.thumbnailUrl,
    required this.tags,
  });

  factory ProductInfo.fromJson(Map<String, dynamic> json) {
    return ProductInfo(
      productId: json['product_id'] as String? ?? '',
      name: json['product_name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String? ?? '',
      selledAmount: (json['selled_amount'] as num?)?.toInt() ?? 0,
      reviewCount: (json['review_count'] as num?)?.toInt() ?? 0,
      ratingAvg: (json['rating_avg'] as num?)?.toDouble() ?? 0.0,
      originCountry: json['origin_country'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      tags: (json['tags'] as List?)?.cast<String>() ?? [],
    );
  }
}

class ProductDetail {
  final ProductInfo product;
  final List<VariantModel> variants;
  final List<DetailImage> productImages;
  final Map<String, List<DetailImage>> imagesByVariant;

  ProductDetail({
    required this.product,
    required this.variants,
    required this.productImages,
    required this.imagesByVariant,
  });

  factory ProductDetail.fromJson(Map<String, dynamic> json) {
    final productJson = json['product'] as Map<String, dynamic>? ?? {};
    final variantsJson = (json['variants'] as List?) ?? [];

    final imagesJson = json['images'] as Map<String, dynamic>? ?? {};
    final productImagesJson = (imagesJson['product'] as List?) ?? [];
    final byVariantJson =
        imagesJson['byVariant'] as Map<String, dynamic>? ?? {};

    return ProductDetail(
      product: ProductInfo.fromJson(productJson),
      variants: variantsJson
          .map((e) => VariantModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      productImages: productImagesJson
          .map((e) => DetailImage.fromJson(e as Map<String, dynamic>))
          .toList(),
      imagesByVariant: byVariantJson.map((key, value) {
        final list = (value as List)
            .map((e) => DetailImage.fromJson(e as Map<String, dynamic>))
            .toList();
        return MapEntry(key, list);
      }),
    );
  }
}
