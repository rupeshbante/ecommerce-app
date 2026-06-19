using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController(IReviewService reviewService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetProductReviews(int productId) =>
        Ok(await reviewService.GetProductReviewsAsync(productId));

    [HttpGet("product/{productId}/summary")]
    public async Task<IActionResult> GetRatingSummary(int productId) =>
        Ok(await reviewService.GetRatingSummaryAsync(productId));

    [HttpGet("product/{productId}/my-review")]
    [Authorize]
    public async Task<IActionResult> GetMyReview(int productId)
    {
        var review = await reviewService.GetUserReviewForProductAsync(UserId, productId);
        return Ok(review); // null = no review yet (not an error)
    }

    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
    {
        try
        {
            var review = await reviewService.CreateReviewAsync(UserId, dto);
            return CreatedAtAction(nameof(GetProductReviews), new { productId = dto.ProductId }, review);
        }
        catch
        {
            return Conflict(new { message = "You have already reviewed this product" });
        }
    }

    [HttpPut("{id}"), Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReviewDto dto)
    {
        var result = await reviewService.UpdateReviewAsync(id, UserId, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id) =>
        await reviewService.DeleteReviewAsync(id, UserId) ? NoContent() : NotFound();
}
