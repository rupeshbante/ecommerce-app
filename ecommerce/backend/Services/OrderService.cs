using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class OrderService(AppDbContext db, IEmailService emailService, INotificationService notificationService) : IOrderService
{
    public async Task<OrderResponseDto?> CreateOrderAsync(int userId, CreateOrderDto dto)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return null;

        var order = new Order { UserId = userId, ShippingAddress = dto.ShippingAddress };

        decimal total = 0;
        foreach (var item in dto.Items)
        {
            var product = await db.Products.FindAsync(item.ProductId);
            if (product == null || product.Stock < item.Quantity) return null;
            product.Stock -= item.Quantity;
            var unitPrice = product.Price;

            if (item.VariantId.HasValue)
            {
                var variant = await db.ProductVariants.FindAsync(item.VariantId.Value);
                if (variant != null) { unitPrice += variant.PriceModifier; variant.Stock -= item.Quantity; }
            }

            total += unitPrice * item.Quantity;
            order.OrderItems.Add(new OrderItem { ProductId = item.ProductId, Quantity = item.Quantity, UnitPrice = unitPrice, VariantId = item.VariantId });
        }

        // Apply coupon discount if provided
        if (!string.IsNullOrEmpty(dto.CouponCode))
        {
            var coupon = await db.Coupons.FirstOrDefaultAsync(c =>
                c.Code == dto.CouponCode && c.IsActive &&
                (c.ExpiryDate == null || c.ExpiryDate > DateTime.UtcNow) &&
                (c.MaxUses == 0 || c.UsedCount < c.MaxUses) &&
                total >= c.MinOrderAmount);
            if (coupon != null)
            {
                var discount = coupon.DiscountType == "Percentage"
                    ? Math.Round(total * coupon.DiscountValue / 100, 2)
                    : Math.Min(coupon.DiscountValue, total);
                order.CouponCode = coupon.Code;
                order.DiscountAmount = discount;
                total -= discount;
                coupon.UsedCount++;
            }
        }

        order.TotalAmount = total;
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        db.OrderStatusHistories.Add(new Models.OrderStatusHistory
        {
            OrderId = order.Id,
            Status = "Pending",
            Note = "Order placed successfully"
        });
        await db.SaveChangesAsync();

        // Send confirmation email and notification
        _ = emailService.SendOrderConfirmationAsync(user.Email, user.FullName, order.Id, total);
        await notificationService.CreateNotificationAsync(new CreateNotificationDto(
            userId, "Order Placed!", $"Your order #{order.Id} has been placed successfully for ₹{total:N0}", "order", "/orders"));

        return await GetOrderByIdAsync(order.Id, userId);
    }

    public async Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId) =>
        await db.Orders.Where(o => o.UserId == userId)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(o => o.Payment)
            .Include(o => o.ReturnRequest)
            .Include(o => o.StatusHistory)
            .Select(o => MapOrder(o)).ToListAsync();

    public async Task<OrderResponseDto?> GetOrderByIdAsync(int id, int userId) =>
        await db.Orders.Where(o => o.Id == id && o.UserId == userId)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(o => o.Payment)
            .Include(o => o.ReturnRequest)
            .Include(o => o.StatusHistory)
            .Select(o => MapOrder(o)).FirstOrDefaultAsync();

    private static OrderResponseDto MapOrder(Order o)
    {
        var payment = o.Payment == null ? null : new PaymentDto(o.Payment.Id, o.Payment.OrderId, o.Payment.RazorpayPaymentId, o.Payment.Amount, o.Payment.Status, o.Payment.Method, o.Payment.CreatedAt, o.Payment.PaidAt);
        var returnReq = o.ReturnRequest == null ? null : new ReturnRequestDto(o.ReturnRequest.Id, o.ReturnRequest.OrderId, o.ReturnRequest.Reason, o.ReturnRequest.Description, o.ReturnRequest.Status, o.ReturnRequest.AdminNote, o.ReturnRequest.RequestedAt, o.ReturnRequest.ProcessedAt);
        var history = o.StatusHistory
            .OrderBy(h => h.ChangedAt)
            .Select(h => new OrderStatusHistoryDto(h.Status, h.ChangedAt, h.Note))
            .ToList();
        return new OrderResponseDto(
            o.Id, o.OrderDate, o.TotalAmount, o.Status, o.ShippingAddress,
            o.OrderItems.Select(oi => new OrderItemResponseDto(oi.ProductId, oi.Product.Name, oi.Quantity, oi.UnitPrice, oi.Product.ImageUrl)).ToList(),
            payment, returnReq, o.CouponCode, o.DiscountAmount, history);
    }
}
