using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;
using ECommerceAPI.Data;
using ECommerceAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService productService, AppDbContext db, IStockNotificationService stockNotifications) : ControllerBase
{
    private int? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) is string s ? int.Parse(s) : null;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category, [FromQuery] string? search,
        [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
        [FromQuery] int? minRating, [FromQuery] string? sortBy) =>
        Ok(await productService.GetAllAsync(category, search, minPrice, maxPrice, minRating, sortBy));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await productService.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateProductDto dto)
    {
        var product = await productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        var result = await productService.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id) =>
        await productService.DeleteAsync(id) ? NoContent() : NotFound();

    // ── Product Images ──────────────────────────────────────────
    [HttpGet("{id}/images")]
    public async Task<IActionResult> GetImages(int id) =>
        Ok(await db.ProductImages.Where(i => i.ProductId == id).OrderBy(i => i.SortOrder)
            .Select(i => new ProductImageDto(i.Id, i.Url, i.IsPrimary, i.SortOrder)).ToListAsync());

    [HttpPost("{id}/images"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddImage(int id, [FromBody] AddProductImageDto dto)
    {
        if (dto.IsPrimary)
        {
            var existing = await db.ProductImages.Where(i => i.ProductId == id && i.IsPrimary).ToListAsync();
            existing.ForEach(i => i.IsPrimary = false);
        }
        var img = new ProductImage { ProductId = id, Url = dto.Url, IsPrimary = dto.IsPrimary, SortOrder = dto.SortOrder };
        db.ProductImages.Add(img);
        await db.SaveChangesAsync();
        return Ok(new ProductImageDto(img.Id, img.Url, img.IsPrimary, img.SortOrder));
    }

    [HttpDelete("{id}/images/{imageId}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        var img = await db.ProductImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == id);
        if (img == null) return NotFound();
        db.ProductImages.Remove(img);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Product Variants ──────────────────────────────────────────
    [HttpGet("{id}/variants")]
    public async Task<IActionResult> GetVariants(int id) =>
        Ok(await db.ProductVariants.Where(v => v.ProductId == id && v.IsActive)
            .Select(v => new ProductVariantDto(v.Id, v.Name, v.Value, v.PriceModifier, v.Stock, v.Sku, v.IsActive)).ToListAsync());

    [HttpPost("{id}/variants"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddVariant(int id, [FromBody] CreateVariantDto dto)
    {
        var variant = new ProductVariant { ProductId = id, Name = dto.Name, Value = dto.Value, PriceModifier = dto.PriceModifier, Stock = dto.Stock, Sku = dto.Sku };
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync();
        return Ok(new ProductVariantDto(variant.Id, variant.Name, variant.Value, variant.PriceModifier, variant.Stock, variant.Sku, variant.IsActive));
    }

    [HttpPut("{id}/variants/{variantId}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateVariant(int id, int variantId, [FromBody] UpdateVariantDto dto)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (variant == null) return NotFound();
        variant.Name = dto.Name; variant.Value = dto.Value; variant.PriceModifier = dto.PriceModifier;
        variant.Stock = dto.Stock; variant.Sku = dto.Sku; variant.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        return Ok(new ProductVariantDto(variant.Id, variant.Name, variant.Value, variant.PriceModifier, variant.Stock, variant.Sku, variant.IsActive));
    }

    [HttpDelete("{id}/variants/{variantId}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteVariant(int id, int variantId)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (variant == null) return NotFound();
        variant.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Low Stock ──────────────────────────────────────────────
    [HttpGet("low-stock"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetLowStock([FromQuery] int threshold = 5) =>
        Ok(await productService.GetLowStockProductsAsync(threshold));

    // ── Bulk CSV Import ────────────────────────────────────────
    [HttpPost("bulk-import"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> BulkImport(IFormFile file)
    {
        if (file == null || !file.FileName.EndsWith(".csv"))
            return BadRequest(new { message = "Please upload a valid CSV file" });

        var products = new List<CreateProductDto>();
        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var header = await reader.ReadLineAsync(); // skip header
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrEmpty(line)) continue;
            var cols = line.Split(',');
            if (cols.Length < 6) continue;
            if (decimal.TryParse(cols[2].Trim(), out var price) && int.TryParse(cols[3].Trim(), out var stock))
            {
                products.Add(new CreateProductDto(cols[0].Trim(), cols[1].Trim(), price, stock, cols[4].Trim(), cols[5].Trim()));
            }
        }

        if (!products.Any()) return BadRequest(new { message = "No valid products found in CSV" });
        await productService.BulkImportAsync(products);
        return Ok(new { message = $"{products.Count} products imported successfully" });
    }

    // ── Notify Me (back in stock) ──────────────────────────────
    [HttpPost("{id}/notify-me")]
    public async Task<IActionResult> NotifyMe(int id, [FromBody] NotifyMeDto dto)
    {
        var product = await db.Products.FindAsync(id);
        if (product == null) return NotFound();
        if (product.Stock > 0) return BadRequest(new { message = "Product is already in stock." });
        await stockNotifications.SubscribeAsync(id, dto.Email, dto.UserName);
        return Ok(new { message = "You'll be notified when this product is back in stock!" });
    }

    // ── CSV Template Download ──────────────────────────────────
    [HttpGet("bulk-import/template"), Authorize(Roles = "Admin")]
    public IActionResult DownloadTemplate()
    {
        var csv = new StringBuilder();
        csv.AppendLine("Name,Description,Price,Stock,Category,ImageUrl");
        csv.AppendLine("Sample Product,This is a description,999,100,Electronics,https://example.com/image.jpg");
        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "products_import_template.csv");
    }
}
