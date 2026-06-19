namespace ECommerceAPI.DTOs;

public record NotificationDto(
    int Id,
    string Title,
    string Message,
    string Type,
    string? Link,
    bool IsRead,
    DateTime CreatedAt
);

public record CreateNotificationDto(
    int UserId,
    string Title,
    string Message,
    string Type,
    string? Link
);
