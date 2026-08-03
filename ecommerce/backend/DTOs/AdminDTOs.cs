namespace ECommerceAPI.DTOs;

public record DashboardStatsDto(
    int TotalOrders, decimal TotalSales, int TotalCustomers, int TotalProducts,
    int PendingOrders, int LowStockProducts,
    decimal SalesToday, decimal SalesThisMonth,
    List<ChartDataDto> RevenueByDay,
    List<TopProductDto> TopProducts,
    List<AdminOrderSummaryDto> RecentOrders
);

public record ChartDataDto(string Label, decimal Value);

public record TopProductDto(int Id, string Name, string Category, int TotalSold, decimal Revenue);

public record AdminOrderSummaryDto(
    int Id, string CustomerName, string CustomerEmail,
    decimal TotalAmount, string Status, string OrderDate, int ItemCount
);

public record AdminCustomerDto(
    int Id, string FullName, string Email, string Role,
    string CreatedAt, int TotalOrders, decimal TotalSpent
);

public record AdminOrderDetailDto(
    int Id, string CustomerName, string CustomerEmail,
    decimal TotalAmount, string Status, string ShippingAddress,
    string OrderDate, List<AdminOrderItemDto> Items,
    string? TrackingNumber = null, string? Carrier = null
);

public record AdminOrderItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice);

public record UpdateOrderStatusDto(string Status, string? TrackingNumber = null, string? Carrier = null);

public record UpdateUserRoleDto(string Role);

public record SalesReportDto(
    decimal TotalRevenue, int TotalOrders, int TotalCustomers, int TotalProducts,
    List<ChartDataDto> DailyRevenue,
    List<ChartDataDto> MonthlyRevenue,
    List<TopProductDto> TopProducts,
    List<CategoryRevenueDto> CategoryRevenue
);

public record CategoryRevenueDto(string Category, decimal Revenue, int Orders);

public record UploadImageResponseDto(string Url);
