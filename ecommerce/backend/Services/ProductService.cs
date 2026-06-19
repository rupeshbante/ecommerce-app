using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ProductService(AppDbContext db, IEmailService emailService, IConfiguration config, IStockNotificationService stockNotifications) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetAllAsync(string? category, string? search,
        decimal? minPrice = null, decimal? maxPrice = null, int? minRating = null, string? sortBy = null)
    {
        var query = db.Products.Where(p => p.IsActive)
            .Include(p => p.Reviews)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category)) query = query.Where(p => p.Category == category);
        if (!string.IsNullOrEmpty(search)) query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

        var products = await query.ToListAsync();

        if (minRating.HasValue)
            products = products.Where(p => !p.Reviews.Any() || p.Reviews.Average(r => r.Rating) >= minRating.Value).ToList();

        products = sortBy switch
        {
            "price_asc" => products.OrderBy(p => p.Price).ToList(),
            "price_desc" => products.OrderByDescending(p => p.Price).ToList(),
            "rating" => products.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0).ToList(),
            "newest" => products.OrderByDescending(p => p.CreatedAt).ToList(),
            _ => products.OrderByDescending(p => p.CreatedAt).ToList()
        };

        return products.Select(p => ToDto(p));
    }

    public async Task<ProductDto?> GetByIdAsync(int id) =>
        await db.Products.Where(p => p.Id == id)
            .Include(p => p.Reviews)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Select(p => ToDto(p)).FirstOrDefaultAsync();

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var p = new Product { Name = dto.Name, Description = dto.Description, Price = dto.Price, Stock = dto.Stock, Category = dto.Category, ImageUrl = dto.ImageUrl };
        db.Products.Add(p);
        await db.SaveChangesAsync();
        return ToDto(p);
    }

    public async Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto)
    {
        var p = await db.Products.Include(x => x.Reviews).Include(x => x.Images).Include(x => x.Variants).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return null;
        var wasOutOfStock = p.Stock == 0;
        p.Name = dto.Name; p.Description = dto.Description; p.Price = dto.Price;
        p.Stock = dto.Stock; p.Category = dto.Category; p.ImageUrl = dto.ImageUrl; p.IsActive = dto.IsActive;
        p.SalePrice = dto.SalePrice;
        p.SaleEndsAt = dto.SaleEndsAt;
        await db.SaveChangesAsync();

        // Notify subscribers if back in stock
        if (wasOutOfStock && p.Stock > 0)
            _ = stockNotifications.NotifySubscribersAsync(p.Id, p.Name);

        // Check low stock
        if (p.Stock <= p.LowStockThreshold && p.Stock > 0)
        {
            var adminEmail = config["Email:AdminEmail"] ?? "admin@shopease.in";
            await emailService.SendLowStockAlertAsync(adminEmail, p.Name, p.Stock);
        }

        return ToDto(p);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var p = await db.Products.FindAsync(id);
        if (p == null) return false;
        p.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProductDto>> GetLowStockProductsAsync(int threshold = 5) =>
        await db.Products.Where(p => p.IsActive && p.Stock <= threshold)
            .Include(p => p.Reviews).Include(p => p.Images).Include(p => p.Variants)
            .Select(p => ToDto(p)).ToListAsync();

    public async Task<bool> BulkImportAsync(List<CreateProductDto> products)
    {
        var entities = products.Select(dto => new Product
        {
            Name = dto.Name, Description = dto.Description, Price = dto.Price,
            Stock = dto.Stock, Category = dto.Category, ImageUrl = dto.ImageUrl
        }).ToList();
        db.Products.AddRange(entities);
        await db.SaveChangesAsync();
        return true;
    }

    private static ProductDto ToDto(Product p)
    {
        var avgRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0;
        var images = p.Images.OrderBy(i => i.SortOrder).Select(i => new ProductImageDto(i.Id, i.Url, i.IsPrimary, i.SortOrder)).ToList();
        var variants = p.Variants.Where(v => v.IsActive).Select(v => new ProductVariantDto(v.Id, v.Name, v.Value, v.PriceModifier, v.Stock, v.Sku, v.IsActive)).ToList();
        // Clear expired sales
        var salePrice = p.SaleEndsAt.HasValue && p.SaleEndsAt.Value > DateTime.UtcNow ? p.SalePrice : null;
        var saleEndsAt = salePrice.HasValue ? p.SaleEndsAt : null;
        return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.Category, p.ImageUrl, p.IsActive, avgRating, p.Reviews.Count, images, variants, salePrice, saleEndsAt);
    }
}
