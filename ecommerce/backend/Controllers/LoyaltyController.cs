using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoyaltyController(ILoyaltyService loyaltyService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance() => Ok(await loyaltyService.GetBalanceAsync(UserId));

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory() => Ok(await loyaltyService.GetHistoryAsync(UserId));
}
