using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IWishlistService
{
    Task<List<WishlistItemDto>> GetWishlistAsync(int userId);
    Task<WishlistItemDto?> AddToWishlistAsync(int userId, int productId);
    Task<bool> RemoveFromWishlistAsync(int userId, int productId);
    Task<bool> IsInWishlistAsync(int userId, int productId);
    Task<bool> ToggleWishlistAsync(int userId, int productId);
}
