using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ReferralService(AppDbContext db) : IReferralService
{
    public async Task<string> GetOrCreateReferralCodeAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return string.Empty;

        if (!string.IsNullOrEmpty(user.ReferralCode))
            return user.ReferralCode;

        var code = GenerateCode(user.FullName, userId);
        user.ReferralCode = code;
        await db.SaveChangesAsync();
        return code;
    }

    public async Task<bool> ApplyReferralCodeAsync(int newUserId, string code)
    {
        var referrer = await db.Users.FirstOrDefaultAsync(u => u.ReferralCode == code);
        if (referrer == null || referrer.Id == newUserId) return false;

        var alreadyUsed = await db.Referrals.AnyAsync(r => r.ReferredUserId == newUserId);
        if (alreadyUsed) return false;

        var newUser = await db.Users.FindAsync(newUserId);
        if (newUser == null) return false;

        var referral = new Referral
        {
            ReferrerId = referrer.Id,
            ReferredUserId = newUserId,
            Code = code,
            IsUsed = true,
            UsedAt = DateTime.UtcNow
        };
        db.Referrals.Add(referral);
        await db.SaveChangesAsync();

        // Credit both sides with loyalty points equal to the reward amount (1 point = ₹1),
        // redeemable at checkout the same way any other earned points are.
        var points = (int)referral.RewardAmount;
        referrer.LoyaltyPoints += points;
        newUser.LoyaltyPoints += points;
        db.LoyaltyPointTransactions.AddRange(
            new LoyaltyPointTransaction { UserId = referrer.Id, Points = points, Reason = "ReferralBonus" },
            new LoyaltyPointTransaction { UserId = newUser.Id, Points = points, Reason = "ReferralBonus" }
        );
        await db.SaveChangesAsync();

        return true;
    }

    public async Task<List<ReferralDto>> GetUserReferralsAsync(int userId) =>
        await db.Referrals.Where(r => r.ReferrerId == userId)
            .Include(r => r.ReferredUser)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReferralDto(r.Id, r.Code, r.IsUsed, r.RewardAmount, r.ReferredUser != null ? r.ReferredUser.FullName : null, r.CreatedAt, r.UsedAt))
            .ToListAsync();

    public async Task<ReferralStatsDto> GetReferralStatsAsync(int userId)
    {
        var referrals = await db.Referrals.Where(r => r.ReferrerId == userId).ToListAsync();
        return new ReferralStatsDto(referrals.Count, referrals.Count(r => r.IsUsed), referrals.Where(r => r.IsUsed).Sum(r => r.RewardAmount));
    }

    private static string GenerateCode(string fullName, int userId)
    {
        var prefix = new string(fullName.Where(char.IsLetter).Take(4).ToArray()).ToUpper();
        return $"{prefix}{userId:D4}";
    }
}
