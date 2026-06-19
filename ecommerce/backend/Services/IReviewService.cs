using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IReviewService
{
    Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto dto);
    Task<ReviewDto?> UpdateReviewAsync(int reviewId, int userId, UpdateReviewDto dto);
    Task<bool> DeleteReviewAsync(int reviewId, int userId);
    Task<List<ReviewDto>> GetProductReviewsAsync(int productId);
    Task<ProductRatingSummaryDto> GetRatingSummaryAsync(int productId);
    Task<ReviewDto?> GetUserReviewForProductAsync(int userId, int productId);
}
