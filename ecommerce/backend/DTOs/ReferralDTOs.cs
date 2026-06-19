namespace ECommerceAPI.DTOs;

public record ReferralDto(
    int Id,
    string Code,
    bool IsUsed,
    decimal RewardAmount,
    string? ReferredUserName,
    DateTime CreatedAt,
    DateTime? UsedAt
);

public record ApplyReferralDto(string Code);
public record ReferralStatsDto(int TotalReferrals, int UsedReferrals, decimal TotalEarned);
