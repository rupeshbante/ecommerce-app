using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
    Task<SalesReportDto> GetSalesReportAsync(int days);
    Task<List<AdminCustomerDto>> GetAllCustomersAsync();
    Task<AdminCustomerDto?> GetCustomerAsync(int userId);
    Task<List<AdminOrderSummaryDto>> GetAllOrdersAsync(string? status);
    Task<AdminOrderDetailDto?> GetOrderDetailAsync(int orderId);
    Task<bool> UpdateOrderStatusAsync(int orderId, string status);
    Task<bool> UpdateUserRoleAsync(int userId, string role);
    Task<List<AdminOrderSummaryDto>> GetCustomerOrdersAsync(int userId);
}
