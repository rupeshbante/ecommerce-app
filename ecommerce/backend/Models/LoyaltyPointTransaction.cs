namespace ECommerceAPI.Models;

public class LoyaltyPointTransaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int Points { get; set; } // positive = earned, negative = redeemed
    public string Reason { get; set; } = string.Empty; // OrderDelivered, Redeemed
    public int? OrderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
