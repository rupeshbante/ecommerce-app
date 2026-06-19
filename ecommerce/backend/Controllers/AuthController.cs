using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        if (result == null) return BadRequest(new { message = "Email already exists" });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await authService.LoginAsync(dto);
        if (result == null) return Unauthorized(new { message = "Invalid credentials" });
        return Ok(result);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        var result = await authService.GoogleLoginAsync(dto.GoogleId, dto.Email, dto.FullName);
        if (result == null) return BadRequest(new { message = "Google login failed" });
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        await authService.ForgotPasswordAsync(dto.Email, baseUrl);
        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });
        var result = await authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
        if (!result) return BadRequest(new { message = "Invalid or expired reset link." });
        return Ok(new { message = "Password reset successfully. Please login." });
    }
}
