namespace ECommerceAPI.Services;

public interface IStockNotificationService
{
    Task SubscribeAsync(int productId, string email, string userName);
    Task NotifySubscribersAsync(int productId, string productName);
}
