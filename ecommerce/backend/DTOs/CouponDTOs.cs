namespace ECommerceAPI.DTOs;

public record CouponDto(
    int Id, string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, int MaxUses, int UsedCount,
    string? ExpiryDate, bool IsActive, string CreatedAt,
    bool IsExpired, int RemainingUses
);

public record CreateCouponDto(
    string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, int MaxUses, string? ExpiryDate
);

public record UpdateCouponDto(
    string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, int MaxUses, string? ExpiryDate, bool IsActive
);

public record CouponValidateResult(bool IsValid, string? Message, decimal DiscountAmount, string DiscountType, decimal DiscountValue);
