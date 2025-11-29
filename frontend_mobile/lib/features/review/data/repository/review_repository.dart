import 'dart:io';
import 'package:dio/dio.dart';
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/review/data/model/review_model.dart';

class ReviewRepository {
  final DioClient dioClient;

  ReviewRepository({required this.dioClient});

  Future<List<ReviewModel>> fetchOfProduct(String productId) async {
    try {
      final res = await dioClient.dio.get(
        '/reviews/of/$productId',
        queryParameters: {'page': 1, 'limit': 10},
      );

      final rawData = res.data['data'];

      List<dynamic> items;

      if (rawData is List) {
        // case: { data: [ ... ] }
        items = rawData;
      } else if (rawData is Map<String, dynamic>) {
        // case: { data: { items: [ ... ], ... } }
        final inner = rawData['items'];
        if (inner is List) {
          items = inner;
        } else {
          items = const [];
        }
      } else {
        items = const [];
      }

      return items
          .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      // log cho dễ debug
      print(
        'fetchOfProduct DioException: '
        '${e.response?.statusCode} ${e.response?.data}',
      );
      rethrow;
    } catch (e, s) {
      print('fetchOfProduct parse error: $e');
      print(s);
      rethrow;
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

    final res = await dioClient.dio.post(
      '/reviews/of-product/$productId',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return ReviewModel.fromJson(res.data['data']);
  }

  Future<ReviewModel> update({
    required String reviewId,
    required int rating,
    required String comment,
    List<File> images = const [],
    File? videoFile,
  }) async {
    try {
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

      final res = await dioClient.dio.patch(
        '/reviews/$reviewId',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      print(
        'updateReview response: ${res.data}',
      ); 

      final data = res.data['data'];

      if (data is Map<String, dynamic>) {
        return ReviewModel.fromJson(data);
      } else {
        throw Exception('Unexpected updateReview data: ${res.data}');
      }
    } on DioException catch (e) {
      print(
        'updateReview DioException: '
        '${e.response?.statusCode} ${e.response?.data}',
      );
      rethrow;
    } catch (e, s) {
      print('updateReview parse/local error: $e');
      print(s);
      rethrow;
    }
  }

  Future<void> delete(String reviewId) async {
    await dioClient.dio.delete('/reviews/$reviewId');
  }
}
