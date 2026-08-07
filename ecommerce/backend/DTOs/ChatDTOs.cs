namespace ECommerceAPI.DTOs;

public record SendChatMessageDto(string Message);
public record ChatMessageDto(int Id, string Role, string Content, DateTime CreatedAt);
