namespace ECommerceAPI.Services;

public interface IAuditService
{
    Task LogAsync(int? userId, string userEmail, string action, string entity, string? entityId = null, string? oldValues = null, string? newValues = null, string ipAddress = "");
}
