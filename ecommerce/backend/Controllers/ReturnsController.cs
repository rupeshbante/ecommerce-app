using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReturnsController(IReturnService returnService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetMyReturns() =>
        Ok(await returnService.GetUserReturnRequestsAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReturnRequestDto dto)
    {
        var result = await returnService.CreateReturnRequestAsync(UserId, dto);
        return result == null
            ? BadRequest(new { message = "Return request not allowed. Order must be delivered and no existing return request." })
            : Ok(result);
    }
}
