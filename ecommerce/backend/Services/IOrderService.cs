using ECommerceAPI.DTOs;
namespace ECommerceAPI.Services;
public interface IOrderService
{
    Task<OrderResponseDto?> CreateOrderAsync(int userId, CreateOrderDto dto);
    Task<OrderResponseDto?> CreateGuestOrderAsync(CreateOrderDto dto);
    Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId);
    Task<OrderResponseDto?> GetOrderByIdAsync(int id, int userId);
    Task<OrderResponseDto?> GetGuestOrderAsync(int id, string email);
}
