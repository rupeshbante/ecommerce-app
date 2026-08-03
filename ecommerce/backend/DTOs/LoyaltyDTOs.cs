namespace ECommerceAPI.DTOs;

public record LoyaltyBalanceDto(int Points, decimal ValueInRupees);
public record LoyaltyTransactionDto(int Id, int Points, string Reason, int? OrderId, DateTime CreatedAt);
