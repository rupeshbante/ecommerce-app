using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IChatService
{
    Task<ChatMessageDto> SendMessageAsync(int userId, string userMessage);
    Task<List<ChatMessageDto>> GetHistoryAsync(int userId);
}
