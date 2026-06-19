namespace ECommerceAPI.DTOs;

public record RegisterDto(string FullName, string Email, string Password, string? ReferralCode = null);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string FullName, string Email, string Role, int UserId);
public record GoogleLoginDto(string GoogleId, string Email, string FullName, string? PhotoUrl);
public record ForgotPasswordDto(string Email);
public record ResetPasswordDto(string Token, string NewPassword);
