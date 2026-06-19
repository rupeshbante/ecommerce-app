namespace ECommerceAPI.DTOs;

public record ProductImageDto(int Id, string Url, bool IsPrimary, int SortOrder);
public record AddProductImageDto(int ProductId, string Url, bool IsPrimary, int SortOrder);
public record ReorderImagesDto(List<int> ImageIds); // ordered list
