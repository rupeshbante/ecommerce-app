using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class PaymentService(AppDbContext db, IConfiguration config) : IPaymentService
{
    public async Task<RazorpayOrderResponseDto?> CreateRazorpayOrderAsync(int internalOrderId, int userId)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == internalOrderId && o.UserId == userId);
        if (order == null) return null;

        var keyId = config["Razorpay:KeyId"] ?? "rzp_test_placeholder";
        var keySecret = config["Razorpay:KeySecret"] ?? "placeholder_secret";

        var amountInPaise = (long)(order.TotalAmount * 100);

        // Create Razorpay order via REST API
        var razorpayOrderId = await CreateRazorpayOrderViaApi(keyId, keySecret, amountInPaise, "INR", internalOrderId.ToString());

        // Save pending payment record
        var existing = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == internalOrderId);
        if (existing == null)
        {
            db.Payments.Add(new Payment
            {
                OrderId = internalOrderId,
                RazorpayOrderId = razorpayOrderId,
                Amount = order.TotalAmount,
                Currency = "INR",
                Status = "Pending"
            });
            await db.SaveChangesAsync();
        }
        else
        {
            existing.RazorpayOrderId = razorpayOrderId;
            existing.Status = "Pending";
            await db.SaveChangesAsync();
        }

        return new RazorpayOrderResponseDto(razorpayOrderId, internalOrderId, amountInPaise, "INR", keyId);
    }

    public async Task<bool> VerifyAndSavePaymentAsync(VerifyPaymentDto dto)
    {
        var keySecret = config["Razorpay:KeySecret"] ?? "placeholder_secret";

        // Verify Razorpay signature
        var payload = $"{dto.RazorpayOrderId}|{dto.RazorpayPaymentId}";
        var expectedSignature = ComputeHmacSha256(payload, keySecret);

        if (expectedSignature != dto.RazorpaySignature)
            return false;

        var payment = await db.Payments
            .FirstOrDefaultAsync(p => p.OrderId == dto.InternalOrderId && p.RazorpayOrderId == dto.RazorpayOrderId);

        if (payment == null) return false;

        payment.RazorpayPaymentId = dto.RazorpayPaymentId;
        payment.RazorpaySignature = dto.RazorpaySignature;
        payment.Status = "Paid";
        payment.PaidAt = DateTime.UtcNow;

        var order = await db.Orders.FindAsync(dto.InternalOrderId);
        if (order != null)
            order.Status = "Processing";

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<PaymentDto?> GetPaymentByOrderIdAsync(int orderId, int userId)
    {
        var payment = await db.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.OrderId == orderId && p.Order.UserId == userId);

        return payment == null ? null : new PaymentDto(
            payment.Id, payment.OrderId, payment.RazorpayPaymentId,
            payment.Amount, payment.Status, payment.Method,
            payment.CreatedAt, payment.PaidAt
        );
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static async Task<string> CreateRazorpayOrderViaApi(string keyId, string keySecret, long amountInPaise, string currency, string receipt)
    {
        using var client = new HttpClient();
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}"));
        client.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");

        var payload = new { amount = amountInPaise, currency, receipt };
        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync("https://api.razorpay.com/v1/orders", content);
            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                using var doc = System.Text.Json.JsonDocument.Parse(body);
                return doc.RootElement.GetProperty("id").GetString() ?? $"order_test_{receipt}";
            }
        }
        catch { /* In dev, return test order id */ }

        return $"order_test_{receipt}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
    }
}
