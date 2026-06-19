using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var cats = await db.Categories.Include(c => c.Parent).Include(c => c.Children).ToListAsync();
        return cats.Select(c => ToDto(c, db)).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await db.Categories.Include(c => c.Parent).Include(c => c.Children).FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? null : ToDto(c, db);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var cat = new Category { Name = dto.Name, Description = dto.Description, Icon = dto.Icon ?? "📦", ParentId = dto.ParentId };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();
        return await GetByIdAsync(cat.Id) ?? ToDto(cat, db);
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
    {
        var cat = await db.Categories.FindAsync(id);
        if (cat == null) return null;
        cat.Name = dto.Name; cat.Description = dto.Description;
        cat.Icon = dto.Icon ?? cat.Icon; cat.ParentId = dto.ParentId; cat.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var cat = await db.Categories.FindAsync(id);
        if (cat == null) return false;
        db.Categories.Remove(cat);
        await db.SaveChangesAsync();
        return true;
    }

    private static CategoryDto ToDto(Category c, AppDbContext db) => new(
        c.Id, c.Name, c.Description, c.Icon,
        c.ParentId, c.Parent?.Name,
        c.IsActive, c.CreatedAt.ToString("dd MMM yyyy"),
        db.Products.Count(p => p.Category == c.Name),
        c.Children.Count
    );
}
