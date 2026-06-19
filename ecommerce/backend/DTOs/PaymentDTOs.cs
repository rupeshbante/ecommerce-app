namespace ECommerceAPI.DTOs;

public record CreateRazorpayOrderDto(int OrderId);

public record RazorpayOrderResponseDto(
    string RazorpayOrderId,
    int InternalOrderId,
    long AmountInPaise,
    string Currency,
    string KeyId
);

public record VerifyPaymentDto(
    int InternalOrderId,
    string RazorpayOrderId,
    string RazorpayPaymentId,
    string RazorpaySignature
);

public record PaymentDto(
    int Id,
    int OrderId,
    string RazorpayPaymentId,
    decimal Amount,
    string Status,
    string Method,
    DateTime CreatedAt,
    DateTime? PaidAt
);
