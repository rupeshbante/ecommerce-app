using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ReviewService(AppDbContext db) : IReviewService
{
    public async Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto dto)
    {
        var hasPurchased = await db.OrderItems
            .AnyAsync(oi => oi.ProductId == dto.ProductId && oi.Order.UserId == userId && oi.Order.Status == "Delivered");

        var review = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = Math.Clamp(dto.Rating, 1, 5),
            Title = dto.Title,
            Comment = dto.Comment,
            IsVerifiedPurchase = hasPurchased
        };
        db.Reviews.Add(review);
        await db.SaveChangesAsync();
        return await MapReviewAsync(review.Id);
    }

    public async Task<ReviewDto?> UpdateReviewAsync(int reviewId, int userId, UpdateReviewDto dto)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);
        if (review == null) return null;
        review.Rating = Math.Clamp(dto.Rating, 1, 5);
        review.Title = dto.Title;
        review.Comment = dto.Comment;
        await db.SaveChangesAsync();
        return await MapReviewAsync(review.Id);
    }

    public async Task<bool> DeleteReviewAsync(int reviewId, int userId)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);
        if (review == null) return false;
        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ReviewDto>> GetProductReviewsAsync(int productId) =>
        await db.Reviews.Where(r => r.ProductId == productId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(r.Id, r.ProductId, r.UserId, r.User.FullName, r.Rating, r.Title, r.Comment, r.IsVerifiedPurchase, r.CreatedAt))
            .ToListAsync();

    public async Task<ProductRatingSummaryDto> GetRatingSummaryAsync(int productId)
    {
        var reviews = await db.Reviews.Where(r => r.ProductId == productId).ToListAsync();
        if (!reviews.Any())
            return new ProductRatingSummaryDto(0, 0, new Dictionary<int, int> { {1,0},{2,0},{3,0},{4,0},{5,0} });

        var avg = reviews.Average(r => r.Rating);
        var breakdown = Enumerable.Range(1, 5).ToDictionary(s => s, s => reviews.Count(r => r.Rating == s));
        return new ProductRatingSummaryDto(Math.Round(avg, 1), reviews.Count, breakdown);
    }

    public async Task<ReviewDto?> GetUserReviewForProductAsync(int userId, int productId) =>
        await db.Reviews.Where(r => r.UserId == userId && r.ProductId == productId)
            .Include(r => r.User)
            .Select(r => new ReviewDto(r.Id, r.ProductId, r.UserId, r.User.FullName, r.Rating, r.Title, r.Comment, r.IsVerifiedPurchase, r.CreatedAt))
            .FirstOrDefaultAsync();

    private async Task<ReviewDto> MapReviewAsync(int id) =>
        await db.Reviews.Where(r => r.Id == id).Include(r => r.User)
            .Select(r => new ReviewDto(r.Id, r.ProductId, r.UserId, r.User.FullName, r.Rating, r.Title, r.Comment, r.IsVerifiedPurchase, r.CreatedAt))
            .FirstAsync();
}
