using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class AuthService(AppDbContext db, IConfiguration config, IEmailService emailService) : IAuthService
{
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email)) return null;

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Send welcome email
        _ = emailService.SendWelcomeEmailAsync(dto.Email, dto.FullName);

        // Apply referral code if provided
        if (!string.IsNullOrEmpty(dto.ReferralCode))
        {
            var referrer = await db.Users.FirstOrDefaultAsync(u => u.ReferralCode == dto.ReferralCode);
            if (referrer != null && referrer.Id != user.Id)
            {
                db.Referrals.Add(new Referral { ReferrerId = referrer.Id, ReferredUserId = user.Id, Code = dto.ReferralCode, IsUsed = true, UsedAt = DateTime.UtcNow });
                await db.SaveChangesAsync();
            }
        }

        return new AuthResponseDto(GenerateToken(user), user.FullName, user.Email, user.Role, user.Id);
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        if (user.TwoFactorEnabled)
        {
            await GenerateAndSendOtpAsync(user);
            return new LoginResponseDto(true, Email: user.Email);
        }

        return new LoginResponseDto(false, GenerateToken(user), user.FullName, user.Email, user.Role, user.Id);
    }

    public async Task<AuthResponseDto?> VerifyOtpAsync(string email, string code)
    {
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.Email == email && u.OtpCode == code && u.OtpExpiry > DateTime.UtcNow);
        if (user == null) return null;

        user.OtpCode = null;
        user.OtpExpiry = null;
        await db.SaveChangesAsync();
        return new AuthResponseDto(GenerateToken(user), user.FullName, user.Email, user.Role, user.Id);
    }

    public async Task ResendOtpAsync(string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email && u.TwoFactorEnabled);
        if (user == null) return; // don't reveal whether the email exists
        await GenerateAndSendOtpAsync(user);
    }

    public async Task<bool> SetTwoFactorAsync(int userId, bool enabled)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return false;
        user.TwoFactorEnabled = enabled;
        if (!enabled) { user.OtpCode = null; user.OtpExpiry = null; }
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> GetTwoFactorStatusAsync(int userId) =>
        (await db.Users.FindAsync(userId))?.TwoFactorEnabled ?? false;

    private async Task GenerateAndSendOtpAsync(User user)
    {
        var code = Random.Shared.Next(100000, 999999).ToString();
        user.OtpCode = code;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
        await db.SaveChangesAsync();
        _ = emailService.SendOtpAsync(user.Email, user.FullName, code);
    }

    public async Task<AuthResponseDto?> GoogleLoginAsync(string googleId, string email, string fullName)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);
        if (user == null)
        {
            user = new User { FullName = fullName, Email = email, GoogleId = googleId, PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()) };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            _ = emailService.SendWelcomeEmailAsync(email, fullName);
        }
        else if (string.IsNullOrEmpty(user.GoogleId))
        {
            user.GoogleId = googleId;
            await db.SaveChangesAsync();
        }
        return new AuthResponseDto(GenerateToken(user), user.FullName, user.Email, user.Role, user.Id);
    }

    public async Task<bool> ForgotPasswordAsync(string email, string baseUrl)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return true; // Don't reveal whether email exists
        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);
        await db.SaveChangesAsync();
        var resetLink = $"{baseUrl}/auth/reset-password?token={user.PasswordResetToken}";
        _ = emailService.SendPasswordResetAsync(email, user.FullName, resetLink);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == token && u.PasswordResetExpiry > DateTime.UtcNow);
        if (user == null) return false;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        await db.SaveChangesAsync();
        return true;
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:ExpiryInMinutes"]!)),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
