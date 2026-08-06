namespace ECommerceAPI.Services;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string userName, int orderId, decimal amount);
    Task SendOrderProcessingAsync(string toEmail, string userName, int orderId);
    Task SendOrderShippedAsync(string toEmail, string userName, int orderId);
    Task SendOrderDeliveredAsync(string toEmail, string userName, int orderId);
    Task SendOrderCancelledAsync(string toEmail, string userName, int orderId);
    Task SendWelcomeEmailAsync(string toEmail, string userName);
    Task SendReturnApprovedAsync(string toEmail, string userName, int returnId);
    Task SendLowStockAlertAsync(string adminEmail, string productName, int currentStock);
    Task SendPasswordResetAsync(string toEmail, string userName, string resetLink);
    Task SendBackInStockAsync(string toEmail, string userName, string productName, int productId);
    Task SendOtpAsync(string toEmail, string userName, string code);
}
