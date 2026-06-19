using ECommerceAPI.DTOs;
namespace ECommerceAPI.Services;
public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> GoogleLoginAsync(string googleId, string email, string fullName);
    Task<bool> ForgotPasswordAsync(string email, string baseUrl);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
}
