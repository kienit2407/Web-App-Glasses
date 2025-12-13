import 'dart:io';
import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/review/data/model/review_model.dart';
import 'package:frontend_mobile/core/utils/error.dart';

class ReviewRepository {
  final DioClient dioClient;

  ReviewRepository({required this.dioClient});

  // --- GET LIST ---
  Future<List<ReviewModel>> fetchOfProduct(String productId) async {
    try {
      final res = await dioClient.dio.get(
        '/reviews/of/$productId',
        queryParameters: {'page': 1, 'limit': 10},
      );

      final rawData = res.data['data'];
      List<dynamic> items = rawData is List
          ? rawData
          : (rawData is Map<String, dynamic> ? rawData['items'] : []);

      return items
          .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw e;
    }
  }

  Future<ReviewModel> create({
    required String productId,
    required int rating,
    required String comment,
    List<File> images = const [],
    File? videoFile,
  }) async {
    final formData = FormData();

    formData.fields.addAll([
      MapEntry('rating', rating.toString()),
      MapEntry('comment', comment),
      MapEntry('product_id', productId),
    ]);

    // Thêm ảnh vào formData
    for (final img in images) {
      formData.files.add(
        MapEntry(
          'images', // Key này phải khớp với { name: 'images' } ở Backend
          await MultipartFile.fromFile(
            img.path,
            filename: img.path.split('/').last,
          ),
        ),
      );
    }

    // Thêm video vào formData
    if (videoFile != null) {
      formData.files.add(
        MapEntry(
          'video', // Key này phải khớp với { name: 'video' } ở Backend
          await MultipartFile.fromFile(
            videoFile.path,
            filename: videoFile.path.split('/').last,
          ),
        ),
      );
    }

    try {
      final res = await dioClient.dio.post('/reviews', data: formData);
      return ReviewModel.fromJson(res.data['data']);
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  // --- UPDATE ---
  Future<ReviewModel> update({
    required String reviewId,
    required int rating,
    required String comment,
    List<File> images = const [],
    File? videoFile,
  }) async {
    final formData = FormData();
    formData.fields.addAll([
      MapEntry('rating', rating.toString()),
      MapEntry('comment', comment),
    ]);

    for (final img in images) {
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(
            img.path,
            filename: img.path.split('/').last,
          ),
        ),
      );
    }

    if (videoFile != null) {
      formData.files.add(
        MapEntry(
          'video',
          await MultipartFile.fromFile(
            videoFile.path,
            filename: videoFile.path.split('/').last,
          ),
        ),
      );
    }

    try {
      final res = await dioClient.dio.patch(
        '/reviews/$reviewId',
        data: formData,
      );
      return ReviewModel.fromJson(res.data['data']);
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  // --- DELETE ---
  Future<void> delete(String reviewId) async {
    try {
      await dioClient.dio.delete('/reviews/$reviewId');
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  Exception _mapDioException(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;

    String serverMsg = '';
    if (data is Map && data['msg'] != null) serverMsg = data['msg'];
    if (data is Map && data['message'] != null) serverMsg = data['message'];

    switch (status) {
      case 400:
        return BadRequestException(
          serverMsg.isNotEmpty ? serverMsg : 'Yêu cầu không hợp lệ',
        );
      case 401:
        return UnauthorizedException('Vui lòng đăng nhập lại.');
      case 404:
        return NotFoundException('Không tìm thấy dữ liệu');
      case 413:
        return BadRequestException('File ảnh/video quá lớn');
      case 500:
        return ServerException('Lỗi máy chủ');
      default:
        return NetworkException(
          serverMsg.isNotEmpty ? serverMsg : 'Lỗi kết nối',
        );
    }
  }
}
