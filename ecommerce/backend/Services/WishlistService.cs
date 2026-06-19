using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class WishlistService(AppDbContext db) : IWishlistService
{
    public async Task<List<WishlistItemDto>> GetWishlistAsync(int userId) =>
        await db.WishlistItems.Where(w => w.UserId == userId)
            .Include(w => w.Product)
            .OrderByDescending(w => w.AddedAt)
            .Select(w => new WishlistItemDto(w.Id, w.ProductId, w.Product.Name, w.Product.Price, w.Product.ImageUrl, w.Product.Category, w.Product.Stock, w.AddedAt))
            .ToListAsync();

    public async Task<WishlistItemDto?> AddToWishlistAsync(int userId, int productId)
    {
        if (await db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId))
            return null;

        var item = new WishlistItem { UserId = userId, ProductId = productId };
        db.WishlistItems.Add(item);
        await db.SaveChangesAsync();

        return await db.WishlistItems.Where(w => w.Id == item.Id)
            .Include(w => w.Product)
            .Select(w => new WishlistItemDto(w.Id, w.ProductId, w.Product.Name, w.Product.Price, w.Product.ImageUrl, w.Product.Category, w.Product.Stock, w.AddedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> RemoveFromWishlistAsync(int userId, int productId)
    {
        var item = await db.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        if (item == null) return false;
        db.WishlistItems.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsInWishlistAsync(int userId, int productId) =>
        await db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);

    public async Task<bool> ToggleWishlistAsync(int userId, int productId)
    {
        var existing = await db.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        if (existing != null)
        {
            db.WishlistItems.Remove(existing);
            await db.SaveChangesAsync();
            return false; // removed
        }
        db.WishlistItems.Add(new WishlistItem { UserId = userId, ProductId = productId });
        await db.SaveChangesAsync();
        return true; // added
    }
}
