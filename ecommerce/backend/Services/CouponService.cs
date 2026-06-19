using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class CouponService(AppDbContext db) : ICouponService
{
    public async Task<List<CouponDto>> GetAllAsync() =>
        (await db.Coupons.OrderByDescending(c => c.Id).ToListAsync()).Select(ToDto).ToList();

    public async Task<CouponDto?> GetByIdAsync(int id)
    {
        var c = await db.Coupons.FindAsync(id);
        return c == null ? null : ToDto(c);
    }

    public async Task<CouponDto> CreateAsync(CreateCouponDto dto)
    {
        DateTime? expiry = dto.ExpiryDate == null ? null : DateTime.Parse(dto.ExpiryDate).ToUniversalTime();
        var coupon = new Coupon
        {
            Code = dto.Code.ToUpper(), DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue, MinOrderAmount = dto.MinOrderAmount,
            MaxUses = dto.MaxUses, ExpiryDate = expiry
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();
        return ToDto(coupon);
    }

    public async Task<CouponDto?> UpdateAsync(int id, UpdateCouponDto dto)
    {
        var coupon = await db.Coupons.FindAsync(id);
        if (coupon == null) return null;
        DateTime? expiry = dto.ExpiryDate == null ? null : DateTime.Parse(dto.ExpiryDate).ToUniversalTime();
        coupon.Code = dto.Code.ToUpper(); coupon.DiscountType = dto.DiscountType;
        coupon.DiscountValue = dto.DiscountValue; coupon.MinOrderAmount = dto.MinOrderAmount;
        coupon.MaxUses = dto.MaxUses; coupon.ExpiryDate = expiry; coupon.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        return ToDto(coupon);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var coupon = await db.Coupons.FindAsync(id);
        if (coupon == null) return false;
        db.Coupons.Remove(coupon);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<CouponValidateResult> ValidateAsync(string code, decimal orderAmount)
    {
        var coupon = await db.Coupons.FirstOrDefaultAsync(c =>
            c.Code == code.ToUpper() && c.IsActive &&
            (c.ExpiryDate == null || c.ExpiryDate > DateTime.UtcNow) &&
            (c.MaxUses == 0 || c.UsedCount < c.MaxUses));

        if (coupon == null)
            return new CouponValidateResult(false, "Invalid or expired coupon code.", 0, "", 0);
        if (orderAmount < coupon.MinOrderAmount)
            return new CouponValidateResult(false, $"Minimum order amount of ₹{coupon.MinOrderAmount:N0} required.", 0, coupon.DiscountType, coupon.DiscountValue);

        var discount = coupon.DiscountType == "Percentage"
            ? Math.Round(orderAmount * coupon.DiscountValue / 100, 2)
            : Math.Min(coupon.DiscountValue, orderAmount);

        return new CouponValidateResult(true, null, discount, coupon.DiscountType, coupon.DiscountValue);
    }

    private static CouponDto ToDto(Coupon c)
    {
        var isExpired = c.ExpiryDate.HasValue && c.ExpiryDate.Value < DateTime.UtcNow;
        var remaining = c.MaxUses == 0 ? -1 : c.MaxUses - c.UsedCount;
        return new CouponDto(c.Id, c.Code, c.DiscountType, c.DiscountValue,
            c.MinOrderAmount, c.MaxUses, c.UsedCount,
            c.ExpiryDate?.ToString("yyyy-MM-dd"),
            c.IsActive, c.CreatedAt.ToString("dd MMM yyyy"), isExpired, remaining);
    }
}
