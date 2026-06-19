using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController(IWishlistService wishlistService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetWishlist() => Ok(await wishlistService.GetWishlistAsync(UserId));

    [HttpPost("{productId}")]
    public async Task<IActionResult> Add(int productId)
    {
        var item = await wishlistService.AddToWishlistAsync(UserId, productId);
        return item == null ? Conflict(new { message = "Already in wishlist" }) : Ok(item);
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> Remove(int productId) =>
        await wishlistService.RemoveFromWishlistAsync(UserId, productId) ? NoContent() : NotFound();

    [HttpPost("{productId}/toggle")]
    public async Task<IActionResult> Toggle(int productId)
    {
        var added = await wishlistService.ToggleWishlistAsync(UserId, productId);
        return Ok(new { added, message = added ? "Added to wishlist" : "Removed from wishlist" });
    }

    [HttpGet("{productId}/check")]
    public async Task<IActionResult> Check(int productId) =>
        Ok(new { isInWishlist = await wishlistService.IsInWishlistAsync(UserId, productId) });
}
