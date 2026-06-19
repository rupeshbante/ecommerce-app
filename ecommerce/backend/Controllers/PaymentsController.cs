using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRazorpayOrderDto dto)
    {
        var result = await paymentService.CreateRazorpayOrderAsync(dto.OrderId, UserId);
        return result == null ? NotFound(new { message = "Order not found" }) : Ok(result);
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
    {
        var success = await paymentService.VerifyAndSavePaymentAsync(dto);
        return success ? Ok(new { message = "Payment verified successfully" }) : BadRequest(new { message = "Payment verification failed" });
    }

    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetPayment(int orderId)
    {
        var payment = await paymentService.GetPaymentByOrderIdAsync(orderId, UserId);
        return payment == null ? NotFound() : Ok(payment);
    }
}
