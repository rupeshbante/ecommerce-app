using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public class DashboardService(AppDbContext db, IEmailService emailService, INotificationService notificationService) : IDashboardService
{
    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1);

        var totalOrders = await db.Orders.CountAsync();
        var totalSales = await db.Orders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var totalCustomers = await db.Users.CountAsync(u => u.Role == "Customer");
        var totalProducts = await db.Products.CountAsync(p => p.IsActive);
        var pendingOrders = await db.Orders.CountAsync(o => o.Status == "Pending");
        var lowStock = await db.Products.CountAsync(p => p.IsActive && p.Stock <= 10);
        var salesToday = await db.Orders.Where(o => o.OrderDate.Date == today).SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var salesMonth = await db.Orders.Where(o => o.OrderDate >= monthStart).SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        // Revenue last 7 days
        var revenueByDay = new List<ChartDataDto>();
        for (int i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var rev = await db.Orders.Where(o => o.OrderDate.Date == date).SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            revenueByDay.Add(new ChartDataDto(date.ToString("ddd dd"), rev));
        }

        // Top products by revenue
        var topProducts = await db.OrderItems
            .Include(oi => oi.Product)
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.Category })
            .Select(g => new TopProductDto(
                g.Key.ProductId, g.Key.Name, g.Key.Category,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.Quantity * oi.UnitPrice)
            ))
            .OrderByDescending(t => t.Revenue)
            .Take(5)
            .ToListAsync();

        // Recent orders
        var recentOrders = await db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.OrderDate)
            .Take(8)
            .Select(o => new AdminOrderSummaryDto(
                o.Id, o.User.FullName, o.User.Email, o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy HH:mm"), o.OrderItems.Count
            ))
            .ToListAsync();

        return new DashboardStatsDto(totalOrders, totalSales, totalCustomers, totalProducts,
            pendingOrders, lowStock, salesToday, salesMonth, revenueByDay, topProducts, recentOrders);
    }

    public async Task<SalesReportDto> GetSalesReportAsync(int days)
    {
        var from = DateTime.UtcNow.Date.AddDays(-days);
        var orders = await db.Orders.Where(o => o.OrderDate >= from)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ToListAsync();

        var daily = Enumerable.Range(0, days).Select(i =>
        {
            var d = from.AddDays(i);
            var rev = orders.Where(o => o.OrderDate.Date == d).Sum(o => o.TotalAmount);
            return new ChartDataDto(d.ToString("dd MMM"), rev);
        }).ToList();

        var monthly = orders.GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new ChartDataDto($"{g.Key.Year}-{g.Key.Month:D2}", g.Sum(o => o.TotalAmount)))
            .ToList();

        var topProducts = orders.SelectMany(o => o.OrderItems)
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.Category })
            .Select(g => new TopProductDto(g.Key.ProductId, g.Key.Name, g.Key.Category,
                g.Sum(oi => oi.Quantity), g.Sum(oi => oi.Quantity * oi.UnitPrice)))
            .OrderByDescending(t => t.Revenue).Take(10).ToList();

        var catRevenue = orders.SelectMany(o => o.OrderItems)
            .GroupBy(oi => oi.Product.Category)
            .Select(g => new CategoryRevenueDto(g.Key, g.Sum(oi => oi.Quantity * oi.UnitPrice),
                g.Select(oi => oi.OrderId).Distinct().Count()))
            .ToList();

        var totalCustomers = await db.Users.CountAsync(u => u.Role == "Customer");

        return new SalesReportDto(orders.Sum(o => o.TotalAmount), orders.Count,
            totalCustomers, await db.Products.CountAsync(p => p.IsActive),
            daily, monthly, topProducts, catRevenue);
    }

    public async Task<List<AdminCustomerDto>> GetAllCustomersAsync() =>
        await db.Users.Where(u => u.Role != "Admin")
            .Select(u => new AdminCustomerDto(
                u.Id, u.FullName, u.Email, u.Role,
                u.CreatedAt.ToString("dd MMM yyyy"),
                db.Orders.Count(o => o.UserId == u.Id),
                db.Orders.Where(o => o.UserId == u.Id).Sum(o => (decimal?)o.TotalAmount) ?? 0
            )).OrderByDescending(u => u.Id).ToListAsync();

    public async Task<AdminCustomerDto?> GetCustomerAsync(int userId)
    {
        var u = await db.Users.FindAsync(userId);
        if (u == null) return null;
        var orders = await db.Orders.Where(o => o.UserId == userId).ToListAsync();
        return new AdminCustomerDto(u.Id, u.FullName, u.Email, u.Role,
            u.CreatedAt.ToString("dd MMM yyyy"), orders.Count, orders.Sum(o => o.TotalAmount));
    }

    public async Task<List<AdminOrderSummaryDto>> GetAllOrdersAsync(string? status) =>
        await db.Orders.Include(o => o.User).Include(o => o.OrderItems)
            .Where(o => status == null || o.Status == status)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new AdminOrderSummaryDto(
                o.Id, o.User.FullName, o.User.Email, o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy HH:mm"), o.OrderItems.Count
            )).ToListAsync();

    public async Task<AdminOrderDetailDto?> GetOrderDetailAsync(int orderId)
    {
        var order = await db.Orders.Include(o => o.User).Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return null;
        return new AdminOrderDetailDto(
            order.Id, order.User.FullName, order.User.Email, order.TotalAmount,
            order.Status, order.ShippingAddress, order.OrderDate.ToString("dd MMM yyyy HH:mm"),
            order.OrderItems.Select(oi => new AdminOrderItemDto(
                oi.ProductId, oi.Product.Name, oi.Quantity, oi.UnitPrice)).ToList()
        );
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, string status)
    {
        var order = await db.Orders.Include(o => o.User).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return false;
        order.Status = status;
        db.OrderStatusHistories.Add(new ECommerceAPI.Models.OrderStatusHistory
        {
            OrderId = orderId,
            Status = status,
            Note = status switch
            {
                "Processing" => "Order confirmed and being prepared",
                "Shipped" => "Order dispatched and on the way",
                "Delivered" => "Order delivered successfully",
                "Cancelled" => "Order has been cancelled",
                _ => null
            }
        });
        await db.SaveChangesAsync();

        // Send email + notification based on status
        var user = order.User;
        if (status == "Shipped")
        {
            _ = emailService.SendOrderShippedAsync(user.Email, user.FullName, orderId);
            await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                user.Id, "Order Shipped!", $"Your order #{orderId} is on its way!", "order", "/orders"));
        }
        else if (status == "Delivered")
        {
            _ = emailService.SendOrderDeliveredAsync(user.Email, user.FullName, orderId);
            await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                user.Id, "Order Delivered!", $"Your order #{orderId} has been delivered. Please review!", "order", "/orders"));
        }
        return true;
    }

    public async Task<bool> UpdateUserRoleAsync(int userId, string role)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return false;
        user.Role = role;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<AdminOrderSummaryDto>> GetCustomerOrdersAsync(int userId) =>
        await db.Orders.Include(o => o.User).Include(o => o.OrderItems)
            .Where(o => o.UserId == userId).OrderByDescending(o => o.OrderDate)
            .Select(o => new AdminOrderSummaryDto(
                o.Id, o.User.FullName, o.User.Email, o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy"), o.OrderItems.Count
            )).ToListAsync();
}
