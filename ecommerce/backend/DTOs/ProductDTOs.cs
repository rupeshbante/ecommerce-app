namespace ECommerceAPI.DTOs;

public record ProductDto(
    int Id, string Name, string Description, decimal Price, int Stock,
    string Category, string ImageUrl, bool IsActive,
    double AverageRating, int ReviewCount,
    List<ProductImageDto> Images,
    List<ProductVariantDto> Variants,
    decimal? SalePrice = null,
    DateTime? SaleEndsAt = null
);
public record CreateProductDto(string Name, string Description, decimal Price, int Stock, string Category, string ImageUrl);
public record UpdateProductDto(string Name, string Description, decimal Price, int Stock, string Category, string ImageUrl, bool IsActive, decimal? SalePrice = null, DateTime? SaleEndsAt = null);
public record NotifyMeDto(string Email, string UserName);
public record ProductFilterDto(
    string? Category,
    string? Search,
    decimal? MinPrice,
    decimal? MaxPrice,
    int? MinRating,
    string? SortBy // price_asc, price_desc, rating, newest
);
