import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart'
    show authControllerProvider;
import 'package:frontend_mobile/features/review/data/model/review_model.dart';
import 'package:frontend_mobile/features/review/data/repository/review_repository.dart';
import 'package:frontend_mobile/features/review/presentation/viewmodel/review_state.dart';

class ProductReviewsController extends StateNotifier<ProductReviewsState> {
  final ReviewRepository _repo;
  final Ref _ref;
  final String productId;

  ProductReviewsController({
    required ReviewRepository repo,
    required Ref ref,
    required this.productId,
  }) : _repo = repo,
       _ref = ref,
       super(ProductReviewsState.initial()) {
    fetch(); // auto load khi tạo controller
  }

  String? get _currentUserId {
    final authState = _ref.read(authControllerProvider);
    final user = authState.valueOrNull;
    if (user == null) return null;

    final dynamic u = user;
    final id = u.id ?? u._id;
    return id?.toString();
  }

  Future<void> fetch() async {
    try {
      state = state.copyWith(isLoading: true, clearError: true);

      final items = await _repo.fetchOfProduct(productId);

      final total = items.fold<int>(0, (sum, r) => sum + r.rating);
      final avg = items.isNotEmpty ? total / items.length : 0.0;

      // tìm review của user hiện tại
      final currentUserId = _currentUserId;
      ReviewModel? myReview;
      if (currentUserId != null) {
        for (final rv in items) {
          if (rv.user?.id.toString() == currentUserId) {
            myReview = rv;
            break;
          }
        }
      }

      state = state.copyWith(
        isLoading: false,
        items: items,
        avgRating: avg,
        myReview: myReview,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Tải đánh giá thất bại',
      );
    }
  }

  Future<void> refresh() => fetch();

  Future<void> createOrUpdate({
    required int rating,
    required String comment,
    List<File> images = const [],
    File? videoFile,
  }) async {
    try {
      state = state.copyWith(isLoading: true, clearError: true);

      final my = state.myReview;
      ReviewModel newReview;

      if (my == null) {
        newReview = await _repo.create(
          productId: productId,
          rating: rating,
          comment: comment,
          images: images,
          videoFile: videoFile,
        );
      } else {
        newReview = await _repo.update(
          reviewId: my.id,
          rating: rating,
          comment: comment,
          images: images,
          videoFile: videoFile,
        );
      }

      final items = [
        newReview,
        ...state.items.where((r) => r.id != newReview.id),
      ];

      final total = items.fold<int>(0, (sum, r) => sum + r.rating);
      final avg = items.isNotEmpty ? total / items.length : 0.0;

      state = state.copyWith(
        isLoading: false,
        items: items,
        avgRating: avg,
        myReview: newReview,
      );
    } on DioException catch (e) {
      // lỗi network / BE trả != 200
      final msg =
          (e.response?.data is Map &&
              (e.response?.data as Map)['msg'] is String)
          ? (e.response?.data as Map)['msg'] as String
          : 'Gửi đánh giá thất bại';
      state = state.copyWith(isLoading: false, errorMessage: msg);
    } catch (e, s) {
      // lỗi parse / lỗi logic FE sau khi BE đã OK
      print('createOrUpdate local error: $e');
      print(s);

      // BE đã update thành công (vì DioException không ném),
      // mình fallback bằng cách fetch lại từ server:
      await fetch();

      state = state.copyWith(
        isLoading: false,
        // KHÔNG set errorMessage để khỏi show "Gửi đánh giá thất bại"
      );
    }
  }

  Future<void> deleteMyReview() async {
    final my = state.myReview;
    if (my == null) return;

    try {
      state = state.copyWith(isLoading: true, clearError: true);

      await _repo.delete(my.id);

      final items = state.items.where((r) => r.id != my.id).toList();
      final total = items.fold<int>(0, (sum, r) => sum + r.rating);
      final avg = items.isNotEmpty ? total / items.length : 0.0;

      state = state.copyWith(
        isLoading: false,
        items: items,
        avgRating: avg,
        clearMyReview: true,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Xoá đánh giá thất bại',
      );
    }
  }
}
