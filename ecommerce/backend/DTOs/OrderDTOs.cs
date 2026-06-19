namespace ECommerceAPI.DTOs;

public record CreateOrderDto(string ShippingAddress, List<OrderItemDto> Items, string? CouponCode, int? AddressId);
public record OrderItemDto(int ProductId, int Quantity, int? VariantId);
public record OrderStatusHistoryDto(string Status, DateTime ChangedAt, string? Note);
public record OrderResponseDto(int Id, DateTime OrderDate, decimal TotalAmount, string Status, string ShippingAddress, List<OrderItemResponseDto> Items, PaymentDto? Payment, ReturnRequestDto? ReturnRequest, string? CouponCode = null, decimal DiscountAmount = 0, List<OrderStatusHistoryDto>? StatusHistory = null);
public record OrderItemResponseDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice, string? ProductImageUrl);
