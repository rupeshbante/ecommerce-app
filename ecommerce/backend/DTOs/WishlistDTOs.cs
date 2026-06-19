namespace ECommerceAPI.DTOs;

public record AddToWishlistDto(int ProductId);

public record WishlistItemDto(
    int Id,
    int ProductId,
    string ProductName,
    decimal ProductPrice,
    string ProductImageUrl,
    string ProductCategory,
    int ProductStock,
    DateTime AddedAt
);
