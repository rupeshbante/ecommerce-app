using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IReferralService
{
    Task<string> GetOrCreateReferralCodeAsync(int userId);
    Task<bool> ApplyReferralCodeAsync(int newUserId, string code);
    Task<List<ReferralDto>> GetUserReferralsAsync(int userId);
    Task<ReferralStatsDto> GetReferralStatsAsync(int userId);
}
