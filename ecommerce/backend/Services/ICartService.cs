using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface ICartService
{
    Task<List<CartItemResponseDto>> GetCartAsync(int userId);
    Task<CartItemResponseDto?> AddOrIncrementAsync(int userId, AddCartItemDto dto);
    Task<bool> SetQuantityAsync(int userId, int productId, int? variantId, int quantity);
    Task<bool> RemoveAsync(int userId, int productId, int? variantId);
    Task ClearAsync(int userId);
    Task MergeAsync(int userId, List<AddCartItemDto> items);
}
