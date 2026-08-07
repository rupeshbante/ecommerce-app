using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public class LoyaltyService(AppDbContext db) : ILoyaltyService
{
    public async Task<LoyaltyBalanceDto?> GetBalanceAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        return user == null ? null : new LoyaltyBalanceDto(user.LoyaltyPoints, user.LoyaltyPoints);
    }

    public async Task<List<LoyaltyTransactionDto>> GetHistoryAsync(int userId) =>
        await db.LoyaltyPointTransactions.Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new LoyaltyTransactionDto(t.Id, t.Points, t.Reason, t.OrderId, t.CreatedAt))
            .ToListAsync();
}
