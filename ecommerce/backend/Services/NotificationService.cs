using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class NotificationService(AppDbContext db) : INotificationService
{
    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId) =>
        await db.Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50)
            .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.Type, n.Link, n.IsRead, n.CreatedAt))
            .ToListAsync();

    public async Task<int> GetUnreadCountAsync(int userId) =>
        await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task CreateNotificationAsync(CreateNotificationDto dto)
    {
        db.Notifications.Add(new Notification
        {
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            Link = dto.Link
        });
        await db.SaveChangesAsync();
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
        if (n != null) { n.IsRead = true; await db.SaveChangesAsync(); }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        notifications.ForEach(n => n.IsRead = true);
        await db.SaveChangesAsync();
    }
}
