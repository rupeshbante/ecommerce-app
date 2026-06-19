namespace ECommerceAPI.Models;

public class Referral
{
    public int Id { get; set; }
    public int ReferrerId { get; set; }
    public User Referrer { get; set; } = null!;
    public int? ReferredUserId { get; set; }
    public User? ReferredUser { get; set; }
    public string Code { get; set; } = string.Empty; // unique referral code
    public bool IsUsed { get; set; } = false;
    public decimal RewardAmount { get; set; } = 100; // cashback/discount given
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
}
