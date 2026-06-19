using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IPaymentService
{
    Task<RazorpayOrderResponseDto?> CreateRazorpayOrderAsync(int internalOrderId, int userId);
    Task<bool> VerifyAndSavePaymentAsync(VerifyPaymentDto dto);
    Task<PaymentDto?> GetPaymentByOrderIdAsync(int orderId, int userId);
}
