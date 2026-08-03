using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetMyOrders() => Ok(await orderService.GetUserOrdersAsync(UserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await orderService.GetOrderByIdAsync(id, UserId);
        return order == null ? NotFound() : Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderDto dto)
    {
        var result = await orderService.CreateOrderAsync(UserId, dto);
        return result == null ? BadRequest(new { message = "Out of stock or product not found" }) : CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("guest"), AllowAnonymous]
    public async Task<IActionResult> CreateGuest(CreateOrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GuestEmail) || string.IsNullOrWhiteSpace(dto.GuestName))
            return BadRequest(new { message = "Guest name and email are required" });

        var result = await orderService.CreateGuestOrderAsync(dto);
        return result == null ? BadRequest(new { message = "Out of stock or product not found" }) : Ok(result);
    }

    [HttpGet("guest/{id}"), AllowAnonymous]
    public async Task<IActionResult> GetGuestOrder(int id, [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { message = "Email is required" });
        var order = await orderService.GetGuestOrderAsync(id, email);
        return order == null ? NotFound() : Ok(order);
    }
}
