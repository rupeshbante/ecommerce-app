using ECommerceAPI.DTOs;
namespace ECommerceAPI.Services;
public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> GoogleLoginAsync(string googleId, string email, string fullName);
    Task<bool> ForgotPasswordAsync(string email, string baseUrl);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<AuthResponseDto?> VerifyOtpAsync(string email, string code);
    Task ResendOtpAsync(string email);
    Task<bool> SetTwoFactorAsync(int userId, bool enabled);
    Task<bool> GetTwoFactorStatusAsync(int userId);
}
