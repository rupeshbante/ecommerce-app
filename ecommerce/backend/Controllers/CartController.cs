using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController(ICartService cartService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetCart() => Ok(await cartService.GetCartAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> AddItem(AddCartItemDto dto)
    {
        var item = await cartService.AddOrIncrementAsync(UserId, dto);
        return item == null ? BadRequest(new { message = "Product or variant not found" }) : Ok(item);
    }

    [HttpPut("{productId}")]
    public async Task<IActionResult> SetQuantity(int productId, [FromQuery] int? variantId, UpdateCartQuantityDto dto) =>
        await cartService.SetQuantityAsync(UserId, productId, variantId, dto.Quantity) ? NoContent() : NotFound();

    [HttpDelete("{productId}")]
    public async Task<IActionResult> Remove(int productId, [FromQuery] int? variantId) =>
        await cartService.RemoveAsync(UserId, productId, variantId) ? NoContent() : NotFound();

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        await cartService.ClearAsync(UserId);
        return NoContent();
    }

    [HttpPost("merge")]
    public async Task<IActionResult> Merge(MergeCartDto dto)
    {
        await cartService.MergeAsync(UserId, dto.Items);
        return Ok(await cartService.GetCartAsync(UserId));
    }
}
