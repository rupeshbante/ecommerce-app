using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class StockNotificationService(AppDbContext db, IEmailService emailService) : IStockNotificationService
{
    public async Task SubscribeAsync(int productId, string email, string userName)
    {
        var exists = await db.StockNotifications
            .AnyAsync(n => n.ProductId == productId && n.Email == email && !n.IsNotified);
        if (!exists)
        {
            db.StockNotifications.Add(new StockNotification
            {
                ProductId = productId,
                Email = email,
                UserName = userName
            });
            await db.SaveChangesAsync();
        }
    }

    public async Task NotifySubscribersAsync(int productId, string productName)
    {
        var subscribers = await db.StockNotifications
            .Where(n => n.ProductId == productId && !n.IsNotified)
            .ToListAsync();

        foreach (var sub in subscribers)
        {
            _ = emailService.SendBackInStockAsync(sub.Email, sub.UserName, productName, productId);
            sub.IsNotified = true;
        }

        if (subscribers.Count > 0)
            await db.SaveChangesAsync();
    }
}
