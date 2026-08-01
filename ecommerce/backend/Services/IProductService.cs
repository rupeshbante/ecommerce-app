using ECommerceAPI.DTOs;
namespace ECommerceAPI.Services;
public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(string? category, string? search, decimal? minPrice = null, decimal? maxPrice = null, int? minRating = null, string? sortBy = null);
    Task<PagedResultDto<ProductDto>> GetAllForAdminAsync(string? category, string? search, bool? isActive, int page, int pageSize);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<ProductDto>> GetLowStockProductsAsync(int threshold = 5);
    Task<bool> BulkImportAsync(List<CreateProductDto> products);
}
