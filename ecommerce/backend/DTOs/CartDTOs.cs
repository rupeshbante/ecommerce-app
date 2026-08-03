namespace ECommerceAPI.DTOs;

public record AddCartItemDto(int ProductId, int Quantity, int? VariantId);
public record MergeCartDto(List<AddCartItemDto> Items);

public record CartItemResponseDto(
    int Id, int ProductId, string ProductName, decimal Price, string Category, string? ImageUrl,
    int Quantity, int? VariantId, string? VariantLabel, int Stock
);

public record UpdateCartQuantityDto(int Quantity);
