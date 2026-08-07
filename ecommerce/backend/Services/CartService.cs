using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class CartService(AppDbContext db) : ICartService
{
    public async Task<List<CartItemResponseDto>> GetCartAsync(int userId) =>
        await db.CartItems.Where(c => c.UserId == userId)
            .Include(c => c.Product)
            .Include(c => c.Variant)
            .OrderByDescending(c => c.AddedAt)
            .Select(c => MapItem(c))
            .ToListAsync();

    public async Task<CartItemResponseDto?> AddOrIncrementAsync(int userId, AddCartItemDto dto)
    {
        var product = await db.Products.FindAsync(dto.ProductId);
        if (product == null) return null;

        var stock = product.Stock;
        if (dto.VariantId.HasValue)
        {
            var variant = await db.ProductVariants.FindAsync(dto.VariantId.Value);
            if (variant == null) return null;
            stock = variant.Stock;
        }

        var existing = await db.CartItems.FirstOrDefaultAsync(c =>
            c.UserId == userId && c.ProductId == dto.ProductId && c.VariantId == dto.VariantId);

        if (existing != null)
            existing.Quantity = Math.Min(existing.Quantity + dto.Quantity, Math.Max(stock, 1));
        else
        {
            existing = new CartItem { UserId = userId, ProductId = dto.ProductId, VariantId = dto.VariantId, Quantity = Math.Min(dto.Quantity, Math.Max(stock, 1)) };
            db.CartItems.Add(existing);
        }
        await db.SaveChangesAsync();

        return await db.CartItems.Where(c => c.Id == existing.Id)
            .Include(c => c.Product).Include(c => c.Variant)
            .Select(c => MapItem(c)).FirstOrDefaultAsync();
    }

    public async Task<bool> SetQuantityAsync(int userId, int productId, int? variantId, int quantity)
    {
        var item = await db.CartItems.FirstOrDefaultAsync(c =>
            c.UserId == userId && c.ProductId == productId && c.VariantId == variantId);
        if (item == null) return false;

        if (quantity <= 0)
        {
            db.CartItems.Remove(item);
            await db.SaveChangesAsync();
            return true;
        }

        var stock = variantId.HasValue
            ? (await db.ProductVariants.FindAsync(variantId.Value))?.Stock ?? quantity
            : (await db.Products.FindAsync(productId))?.Stock ?? quantity;

        item.Quantity = Math.Min(quantity, Math.Max(stock, 1));
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveAsync(int userId, int productId, int? variantId)
    {
        var item = await db.CartItems.FirstOrDefaultAsync(c =>
            c.UserId == userId && c.ProductId == productId && c.VariantId == variantId);
        if (item == null) return false;
        db.CartItems.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task ClearAsync(int userId)
    {
        var items = await db.CartItems.Where(c => c.UserId == userId).ToListAsync();
        db.CartItems.RemoveRange(items);
        await db.SaveChangesAsync();
    }

    public async Task MergeAsync(int userId, List<AddCartItemDto> items)
    {
        foreach (var item in items)
            await AddOrIncrementAsync(userId, item);
    }

    private static CartItemResponseDto MapItem(CartItem c) => new(
        c.Id, c.ProductId, c.Product.Name, c.Product.Price, c.Product.Category, c.Product.ImageUrl,
        c.Quantity, c.VariantId, c.Variant != null ? $"{c.Variant.Name}: {c.Variant.Value}" : null,
        c.Variant?.Stock ?? c.Product.Stock
    );
}
