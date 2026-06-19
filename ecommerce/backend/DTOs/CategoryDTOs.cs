namespace ECommerceAPI.DTOs;

public record CategoryDto(
    int Id, string Name, string Description, string Icon,
    int? ParentId, string? ParentName,
    bool IsActive, string CreatedAt, int ProductCount, int SubCategoryCount
);

public record CreateCategoryDto(string Name, string Description, string Icon, int? ParentId);

public record UpdateCategoryDto(string Name, string Description, string Icon, int? ParentId, bool IsActive);
