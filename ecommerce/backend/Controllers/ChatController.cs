using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController(IChatService chatService) : ControllerBase
{
    private int? UserId => User.Identity?.IsAuthenticated == true
        ? int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
        : null;

    // Anonymous visitors send a client-generated id so their messages can be grouped
    // into one conversation without requiring an account.
    private string? GuestSessionId => Request.Headers.TryGetValue("X-Chat-Session", out var v) ? v.ToString() : null;

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendChatMessageDto dto)
    {
        if (UserId == null && string.IsNullOrWhiteSpace(GuestSessionId))
            return BadRequest(new { message = "Missing chat session." });
        return Ok(await chatService.SendMessageAsync(UserId, GuestSessionId, dto.Message));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        if (UserId == null && string.IsNullOrWhiteSpace(GuestSessionId))
            return Ok(new List<DTOs.ChatMessageDto>());
        return Ok(await chatService.GetHistoryAsync(UserId, GuestSessionId));
    }
}
