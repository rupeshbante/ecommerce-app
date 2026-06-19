namespace ECommerceAPI.DTOs;

public record ProductVariantDto(int Id, string Name, string Value, decimal PriceModifier, int Stock, string Sku, bool IsActive);
public record CreateVariantDto(string Name, string Value, decimal PriceModifier, int Stock, string Sku);
public record UpdateVariantDto(string Name, string Value, decimal PriceModifier, int Stock, string Sku, bool IsActive);
