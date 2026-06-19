using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface ICouponService
{
    Task<List<CouponDto>> GetAllAsync();
    Task<CouponDto?> GetByIdAsync(int id);
    Task<CouponDto> CreateAsync(CreateCouponDto dto);
    Task<CouponDto?> UpdateAsync(int id, UpdateCouponDto dto);
    Task<bool> DeleteAsync(int id);
    Task<CouponValidateResult> ValidateAsync(string code, decimal orderAmount);
}
