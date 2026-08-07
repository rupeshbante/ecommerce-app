namespace ECommerceAPI.Models;

public class ProductAnswer
{
    public int Id { get; set; }
    public int ProductQuestionId { get; set; }
    public ProductQuestion Question { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Answer { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
