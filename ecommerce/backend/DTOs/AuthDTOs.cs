namespace ECommerceAPI.DTOs;

public record RegisterDto(string FullName, string Email, string Password, string? ReferralCode = null);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string FullName, string Email, string Role, int UserId);
public record GoogleLoginDto(string GoogleId, string Email, string FullName, string? PhotoUrl);
public record ForgotPasswordDto(string Email);
public record ResetPasswordDto(string Token, string NewPassword);
public record LoginResponseDto(bool RequiresOtp, string? Token = null, string? FullName = null, string? Email = null, string? Role = null, int? UserId = null);
public record VerifyOtpDto(string Email, string Code);
public record ResendOtpDto(string Email);
public record ToggleTwoFactorDto(bool Enabled);
public record TwoFactorStatusDto(bool Enabled);
