using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api")]
public class ProductQAController(IProductQAService qaService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdminOrManager => User.IsInRole("Admin") || User.IsInRole("Manager");

    [HttpGet("products/{productId}/questions")]
    public async Task<IActionResult> GetForProduct(int productId) =>
        Ok(await qaService.GetForProductAsync(productId));

    [HttpPost("products/{productId}/questions"), Authorize]
    public async Task<IActionResult> Ask(int productId, [FromBody] CreateQuestionDto dto)
    {
        var question = await qaService.AskAsync(UserId, dto with { ProductId = productId });
        return CreatedAtAction(nameof(GetForProduct), new { productId }, question);
    }

    [HttpPost("questions/{id}/answers"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Answer(int id, [FromBody] CreateAnswerDto dto)
    {
        var result = await qaService.AnswerAsync(UserId, id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("questions/{id}"), Authorize]
    public async Task<IActionResult> Delete(int id) =>
        await qaService.DeleteQuestionAsync(id, UserId, IsAdminOrManager) ? NoContent() : NotFound();
}
