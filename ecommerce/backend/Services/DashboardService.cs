using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Hubs;

namespace ECommerceAPI.Services;

public class DashboardService(AppDbContext db, IEmailService emailService, INotificationService notificationService, IHubContext<NotificationHub> hub) : IDashboardService
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

        // Top products by revenue (grouped client-side after materializing — GroupBy+nested Sum
        // in a single Select doesn't translate on the SQL Server provider, only Npgsql)
        var allOrderItems = await db.OrderItems.Include(oi => oi.Product).ToListAsync();
        var topProducts = allOrderItems
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.Category })
            .Select(g => new TopProductDto(
                g.Key.ProductId, g.Key.Name, g.Key.Category,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.Quantity * oi.UnitPrice)
            ))
            .OrderByDescending(t => t.Revenue)
            .Take(5)
            .ToList();

        // Recent orders
        var recentOrders = await db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.OrderDate)
            .Take(8)
            .Select(o => new AdminOrderSummaryDto(
                o.Id, o.User != null ? o.User.FullName : (o.GuestName ?? "Guest"), o.User != null ? o.User.Email : (o.GuestEmail ?? ""), o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy HH:mm"), o.OrderItems.Count
            ))
            .ToListAsync();

        var ordersByStatus = await db.Orders.GroupBy(o => o.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .ToListAsync();

        return new DashboardStatsDto(totalOrders, totalSales, totalCustomers, totalProducts,
            pendingOrders, lowStock, salesToday, salesMonth, revenueByDay, topProducts, recentOrders, ordersByStatus);
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

        var ordersByStatus = orders.GroupBy(o => o.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .ToList();

        return new SalesReportDto(orders.Sum(o => o.TotalAmount), orders.Count,
            totalCustomers, await db.Products.CountAsync(p => p.IsActive),
            daily, monthly, topProducts, catRevenue, ordersByStatus);
    }

    public async Task<List<AdminCustomerDto>> GetAllCustomersAsync() =>
        await db.Users.Where(u => u.Role != "Admin")
            .OrderByDescending(u => u.Id)
            .Select(u => new AdminCustomerDto(
                u.Id, u.FullName, u.Email, u.Role,
                u.CreatedAt.ToString("dd MMM yyyy"),
                db.Orders.Count(o => o.UserId == u.Id),
                db.Orders.Where(o => o.UserId == u.Id).Sum(o => (decimal?)o.TotalAmount) ?? 0
            )).ToListAsync();

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
                o.Id, o.User != null ? o.User.FullName : (o.GuestName ?? "Guest"), o.User != null ? o.User.Email : (o.GuestEmail ?? ""), o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy HH:mm"), o.OrderItems.Count
            )).ToListAsync();

    public async Task<AdminOrderDetailDto?> GetOrderDetailAsync(int orderId)
    {
        var order = await db.Orders.Include(o => o.User).Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return null;
        return new AdminOrderDetailDto(
            order.Id, order.User?.FullName ?? order.GuestName ?? "Guest", order.User?.Email ?? order.GuestEmail ?? "", order.TotalAmount,
            order.Status, order.ShippingAddress, order.OrderDate.ToString("dd MMM yyyy HH:mm"),
            order.OrderItems.Select(oi => new AdminOrderItemDto(
                oi.ProductId, oi.Product.Name, oi.Quantity, oi.UnitPrice)).ToList(),
            order.TrackingNumber, order.Carrier
        );
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, string status, string? trackingNumber = null, string? carrier = null)
    {
        var order = await db.Orders.Include(o => o.User).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return false;
        var wasAlreadyDelivered = order.Status == "Delivered";
        order.Status = status;
        if (trackingNumber != null) order.TrackingNumber = trackingNumber;
        if (carrier != null) order.Carrier = carrier;
        var statusNote = status switch
        {
            "Processing" => "Order confirmed and being prepared",
            "Shipped" => "Order dispatched and on the way",
            "OutForDelivery" => "Order is out for delivery",
            "Delivered" => "Order delivered successfully",
            "Cancelled" => "Order has been cancelled",
            _ => null
        };
        db.OrderStatusHistories.Add(new ECommerceAPI.Models.OrderStatusHistory
        {
            OrderId = orderId,
            Status = status,
            Note = statusNote
        });
        await db.SaveChangesAsync();

        // Send email + notification based on status
        var email = order.User?.Email ?? order.GuestEmail;
        var name = order.User?.FullName ?? order.GuestName ?? "Customer";
        if (status == "Processing")
        {
            if (email != null) _ = emailService.SendOrderProcessingAsync(email, name, orderId);
            if (order.UserId.HasValue) await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                order.UserId.Value, "Order Processing", $"Your order #{orderId} is being prepared.", "order", "/orders"));
        }
        else if (status == "Shipped")
        {
            if (email != null) _ = emailService.SendOrderShippedAsync(email, name, orderId);
            if (order.UserId.HasValue) await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                order.UserId.Value, "Order Shipped!", $"Your order #{orderId} is on its way!", "order", "/orders"));
        }
        else if (status == "OutForDelivery")
        {
            if (email != null) _ = emailService.SendOrderOutForDeliveryAsync(email, name, orderId);
            if (order.UserId.HasValue) await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                order.UserId.Value, "Out for Delivery!", $"Your order #{orderId} is out for delivery and will arrive today.", "order", "/orders"));
        }
        else if (status == "Delivered")
        {
            if (email != null) _ = emailService.SendOrderDeliveredAsync(email, name, orderId);
            if (order.UserId.HasValue) await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                order.UserId.Value, "Order Delivered!", $"Your order #{orderId} has been delivered. Please review!", "order", "/orders"));

            // Award loyalty points (1 point per ₹10 spent), once per order
            if (!wasAlreadyDelivered && order.User != null)
            {
                var earned = (int)(order.TotalAmount / 10);
                if (earned > 0)
                {
                    order.User.LoyaltyPoints += earned;
                    db.LoyaltyPointTransactions.Add(new Models.LoyaltyPointTransaction
                    {
                        UserId = order.User.Id, Points = earned, Reason = "OrderDelivered", OrderId = orderId
                    });
                    await db.SaveChangesAsync();
                }
            }
        }
        else if (status == "Cancelled")
        {
            if (email != null) _ = emailService.SendOrderCancelledAsync(email, name, orderId);
            if (order.UserId.HasValue) await notificationService.CreateNotificationAsync(new DTOs.CreateNotificationDto(
                order.UserId.Value, "Order Cancelled", $"Your order #{orderId} has been cancelled.", "order", "/orders"));
        }

        await hub.Clients.Group($"order_{orderId}").SendAsync("OrderStatusUpdated", new
        {
            orderId,
            status,
            trackingNumber = order.TrackingNumber,
            carrier = order.Carrier,
            changedAt = DateTime.UtcNow,
            note = statusNote
        });

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
                o.Id, o.User != null ? o.User.FullName : (o.GuestName ?? "Guest"), o.User != null ? o.User.Email : (o.GuestEmail ?? ""), o.TotalAmount,
                o.Status, o.OrderDate.ToString("dd MMM yyyy"), o.OrderItems.Count
            )).ToListAsync();
}
