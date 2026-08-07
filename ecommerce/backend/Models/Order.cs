namespace ECommerceAPI.Models;
public class Order
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public string ShippingAddress { get; set; } = string.Empty;
    public string? CouponCode { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public int PointsRedeemed { get; set; } = 0;
    public decimal PointsDiscountAmount { get; set; } = 0;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public Payment? Payment { get; set; }
    public ReturnRequest? ReturnRequest { get; set; }
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
}
