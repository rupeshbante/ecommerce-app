using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController(IChatService chatService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendChatMessageDto dto) =>
        Ok(await chatService.SendMessageAsync(UserId, dto.Message));

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory() => Ok(await chatService.GetHistoryAsync(UserId));
}
