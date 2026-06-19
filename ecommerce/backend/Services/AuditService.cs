using ECommerceAPI.Data;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class AuditService(AppDbContext db) : IAuditService
{
    public async Task LogAsync(int? userId, string userEmail, string action, string entity, string? entityId = null, string? oldValues = null, string? newValues = null, string ipAddress = "")
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId, UserEmail = userEmail, Action = action, Entity = entity,
            EntityId = entityId, OldValues = oldValues, NewValues = newValues, IpAddress = ipAddress
        });
        await db.SaveChangesAsync();
    }
}
