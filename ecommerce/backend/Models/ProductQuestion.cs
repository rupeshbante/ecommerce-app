namespace ECommerceAPI.Models;

public class ProductQuestion
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Question { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProductAnswer> Answers { get; set; } = new List<ProductAnswer>();
}
