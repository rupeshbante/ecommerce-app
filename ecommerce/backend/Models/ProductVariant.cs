namespace ECommerceAPI.Models;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Name { get; set; } = string.Empty; // e.g. "Size", "Color"
    public string Value { get; set; } = string.Empty; // e.g. "L", "Red"
    public decimal PriceModifier { get; set; } = 0; // +/- from base price
    public int Stock { get; set; } = 0;
    public string Sku { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
