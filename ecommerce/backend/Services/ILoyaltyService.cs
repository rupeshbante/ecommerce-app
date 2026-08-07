using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface ILoyaltyService
{
    Task<LoyaltyBalanceDto?> GetBalanceAsync(int userId);
    Task<List<LoyaltyTransactionDto>> GetHistoryAsync(int userId);
}
