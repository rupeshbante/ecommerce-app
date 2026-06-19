namespace ECommerceAPI.DTOs;

public record CreateReviewDto(int ProductId, int Rating, string Title, string Comment);
public record UpdateReviewDto(int Rating, string Title, string Comment);

public record ReviewDto(
    int Id,
    int ProductId,
    int UserId,
    string UserName,
    int Rating,
    string Title,
    string Comment,
    bool IsVerifiedPurchase,
    DateTime CreatedAt
);

public record ProductRatingSummaryDto(
    double AverageRating,
    int TotalReviews,
    Dictionary<int, int> RatingBreakdown // star -> count
);
