using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReferralController(IReferralService referralService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("my-code")]
    public async Task<IActionResult> GetMyCode()
    {
        var code = await referralService.GetOrCreateReferralCodeAsync(UserId);
        return Ok(new { code });
    }

    [HttpGet("my-referrals")]
    public async Task<IActionResult> GetMyReferrals() =>
        Ok(await referralService.GetUserReferralsAsync(UserId));

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() =>
        Ok(await referralService.GetReferralStatsAsync(UserId));

    [HttpPost("apply")]
    public async Task<IActionResult> ApplyCode([FromBody] ApplyReferralDto dto)
    {
        var success = await referralService.ApplyReferralCodeAsync(UserId, dto.Code);
        return success ? Ok(new { message = "Referral code applied! Reward added." }) : BadRequest(new { message = "Invalid or already used code." });
    }
}
