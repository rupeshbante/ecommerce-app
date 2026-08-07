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
        if (!await PopulateOrderItemsAsync(order, dto, user)) return null;

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        AddPlacedHistory(order.Id);
        if (order.PointsRedeemed > 0)
            db.LoyaltyPointTransactions.Add(new LoyaltyPointTransaction { UserId = userId, Points = -order.PointsRedeemed, Reason = "Redeemed", OrderId = order.Id });
        await db.SaveChangesAsync();

        _ = emailService.SendOrderConfirmationAsync(user.Email, user.FullName, order.Id, order.TotalAmount);
        await notificationService.CreateNotificationAsync(new CreateNotificationDto(
            userId, "Order Placed!", $"Your order #{order.Id} has been placed successfully for ₹{order.TotalAmount:N0}", "order", "/orders"));

        return await GetOrderByIdAsync(order.Id, userId);
    }

    public async Task<OrderResponseDto?> CreateGuestOrderAsync(CreateOrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GuestEmail) || string.IsNullOrWhiteSpace(dto.GuestName)) return null;

        var order = new Order
        {
            ShippingAddress = dto.ShippingAddress,
            GuestEmail = dto.GuestEmail.Trim(),
            GuestName = dto.GuestName.Trim(),
            GuestPhone = dto.GuestPhone
        };
        if (!await PopulateOrderItemsAsync(order, dto)) return null;

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        AddPlacedHistory(order.Id);
        await db.SaveChangesAsync();

        _ = emailService.SendOrderConfirmationAsync(order.GuestEmail, order.GuestName, order.Id, order.TotalAmount);

        return await GetGuestOrderAsync(order.Id, order.GuestEmail);
    }

    private async Task<bool> PopulateOrderItemsAsync(Order order, CreateOrderDto dto, User? user = null)
    {
        decimal total = 0;
        foreach (var item in dto.Items)
        {
            var product = await db.Products.FindAsync(item.ProductId);
            if (product == null || product.Stock < item.Quantity) return false;
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

        // Apply loyalty points redemption (logged-in users only; 1 point = ₹1)
        if (user != null && dto.PointsToRedeem is > 0)
        {
            var pointsToRedeem = Math.Min(Math.Min(dto.PointsToRedeem.Value, user.LoyaltyPoints), (int)total);
            if (pointsToRedeem > 0)
            {
                order.PointsRedeemed = pointsToRedeem;
                order.PointsDiscountAmount = pointsToRedeem;
                total -= pointsToRedeem;
                user.LoyaltyPoints -= pointsToRedeem;
            }
        }

        order.TotalAmount = total;
        return true;
    }

    private void AddPlacedHistory(int orderId) =>
        db.OrderStatusHistories.Add(new OrderStatusHistory { OrderId = orderId, Status = "Pending", Note = "Order placed successfully" });

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

    public async Task<OrderResponseDto?> GetGuestOrderAsync(int id, string email) =>
        await db.Orders.Where(o => o.Id == id && o.UserId == null && o.GuestEmail == email)
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
            payment, returnReq, o.CouponCode, o.DiscountAmount, history, o.TrackingNumber, o.Carrier,
            o.PointsRedeemed, o.PointsDiscountAmount);
    }
}
