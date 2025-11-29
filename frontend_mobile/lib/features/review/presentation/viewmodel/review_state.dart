import 'package:frontend_mobile/features/review/data/model/review_model.dart';

class ProductReviewsState {
  final bool isLoading;
  final String? errorMessage;
  final List<ReviewModel> items;
  final double avgRating;
  final ReviewModel? myReview;

  const ProductReviewsState({
    required this.isLoading,
    required this.errorMessage,
    required this.items,
    required this.avgRating,
    required this.myReview,
  });

  factory ProductReviewsState.initial() {
    return const ProductReviewsState(
      isLoading: false,
      errorMessage: null,
      items: [],
      avgRating: 0,
      myReview: null,
    );
  }

  ProductReviewsState copyWith({
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
    List<ReviewModel>? items,
    double? avgRating,
    ReviewModel? myReview,
    bool clearMyReview = false,
  }) {
    return ProductReviewsState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage:
          clearError ? null : (errorMessage ?? this.errorMessage),
      items: items ?? this.items,
      avgRating: avgRating ?? this.avgRating,
      myReview: clearMyReview ? null : (myReview ?? this.myReview),
    );
  }
}
