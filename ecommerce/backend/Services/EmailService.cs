using System.Net;
using System.Net.Mail;

namespace ECommerceAPI.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    private readonly string _host = config["Email:Host"] ?? "smtp.gmail.com";
    private readonly int _port = int.Parse(config["Email:Port"] ?? "587");
    private readonly string _user = config["Email:Username"] ?? "";
    private readonly string _pass = config["Email:Password"] ?? "";
    private readonly string _from = config["Email:From"] ?? "noreply@shopease.in";
    private readonly string _fromName = "ShopEase";

    public Task SendOrderConfirmationAsync(string toEmail, string userName, int orderId, decimal amount) =>
        SendAsync(toEmail, $"Order Confirmed! #{orderId} - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#1a1a2e,#6c63ff);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;font-size:1.8rem;'>Order Confirmed!</h1>
            <p style='color:rgba(255,255,255,0.8);margin:0.5rem 0 0;'>Thank you for shopping with ShopEase</p>
          </div>
          <div style='padding:2rem;'>
            <p style='font-size:1rem;color:#333;'>Hi <strong>{userName}</strong>,</p>
            <p style='color:#555;'>Your order <strong>#{orderId}</strong> has been placed successfully!</p>
            <div style='background:#f5f3ff;border-radius:12px;padding:1.5rem;margin:1.5rem 0;'>
              <p style='margin:0;font-size:1.1rem;'><strong>Order Amount:</strong> ₹{amount:N0}</p>
            </div>
            <p style='color:#555;'>We'll notify you when your order is shipped. Expected delivery: 3-5 business days.</p>
            <a href='https://shopease.in/orders' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Track Order</a>
          </div>
          <div style='background:#f7f8fc;padding:1rem 2rem;text-align:center;font-size:0.8rem;color:#888;'>
            ShopEase Pvt. Ltd. | support@shopease.in | +91 98765 43210
          </div>
        </div>");

    public Task SendOrderProcessingAsync(string toEmail, string userName, int orderId) =>
        SendAsync(toEmail, $"Order #{orderId} is being prepared - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#1a1a2e,#6c63ff);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Your Order is Being Prepared</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Your order <strong>#{orderId}</strong> is confirmed and is now being packed by our team.</p>
            <a href='https://shopease.in/orders' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Track Order</a>
          </div>
        </div>");

    public Task SendOrderShippedAsync(string toEmail, string userName, int orderId) =>
        SendAsync(toEmail, $"Order #{orderId} Shipped! - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#1a1a2e,#6c63ff);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Your Order is on the Way!</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Great news! Your order <strong>#{orderId}</strong> has been shipped and is on its way to you.</p>
            <p style='color:#6c63ff;font-size:1.1rem;font-weight:600;'>Expected delivery: 2-3 business days</p>
            <a href='https://shopease.in/orders' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Track Order</a>
          </div>
        </div>");

    public Task SendOrderDeliveredAsync(string toEmail, string userName, int orderId) =>
        SendAsync(toEmail, $"Order #{orderId} Delivered! Rate your experience", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#00b894,#00cec9);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Order Delivered!</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Your order <strong>#{orderId}</strong> has been delivered. We hope you love your purchase!</p>
            <p>Please take a moment to rate your experience and help other shoppers.</p>
            <a href='https://shopease.in/orders' style='display:inline-block;background:#00b894;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Write a Review</a>
          </div>
        </div>");

    public Task SendOrderCancelledAsync(string toEmail, string userName, int orderId) =>
        SendAsync(toEmail, $"Order #{orderId} Cancelled - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#e17055,#c0392b);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Order Cancelled</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Your order <strong>#{orderId}</strong> has been cancelled. If you were charged, any payment will be refunded within 5-7 business days.</p>
            <a href='https://shopease.in/products' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Continue Shopping</a>
          </div>
        </div>");

    public Task SendWelcomeEmailAsync(string toEmail, string userName) =>
        SendAsync(toEmail, $"Welcome to ShopEase, {userName}!", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#1a1a2e,#6c63ff);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Welcome to ShopEase!</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Welcome aboard! We're thrilled to have you as a member of the ShopEase family.</p>
            <p>Start exploring thousands of products with the best deals and fast delivery.</p>
            <a href='https://shopease.in/products' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Start Shopping</a>
          </div>
        </div>");

    public Task SendReturnApprovedAsync(string toEmail, string userName, int returnId) =>
        SendAsync(toEmail, $"Return Request #{returnId} Approved - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#f39c12,#e17055);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Return Approved</h1>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Your return request <strong>#{returnId}</strong> has been approved. Please ship the items within 48 hours.</p>
            <p>Refund will be processed within 5-7 business days after we receive the items.</p>
          </div>
        </div>");

    public Task SendLowStockAlertAsync(string adminEmail, string productName, int currentStock) =>
        SendAsync(adminEmail, $"Low Stock Alert: {productName}", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:2rem;'>
          <h2 style='color:#e17055;'>Low Stock Alert</h2>
          <p><strong>{productName}</strong> has only <strong>{currentStock} units</strong> remaining in stock.</p>
          <p>Please restock to avoid out-of-stock situations.</p>
          <a href='https://shopease.in/admin/products' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:0.9rem 2rem;border-radius:10px;font-weight:600;margin-top:1rem;'>Manage Products</a>
        </div>");

    public Task SendPasswordResetAsync(string toEmail, string userName, string resetLink) =>
        SendAsync(toEmail, "Reset your ShopEase password", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#1a1a2e,#6c63ff);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Reset Your Password</h1>
            <p style='color:rgba(255,255,255,0.8);margin:0.5rem 0 0;'>ShopEase Account Security</p>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p style='color:#555;'>We received a request to reset your ShopEase password. Click the button below to create a new password:</p>
            <div style='text-align:center;margin:2rem 0;'>
              <a href='{resetLink}' style='display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:1rem 2.5rem;border-radius:12px;font-weight:700;font-size:1rem;'>Reset Password</a>
            </div>
            <p style='color:#888;font-size:0.85rem;'>This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your account is safe.</p>
          </div>
          <div style='background:#f7f8fc;padding:1rem 2rem;text-align:center;font-size:0.8rem;color:#888;'>
            ShopEase Pvt. Ltd. | support@shopease.in
          </div>
        </div>");

    public Task SendBackInStockAsync(string toEmail, string userName, string productName, int productId) =>
        SendAsync(toEmail, $"{productName} is back in stock! - ShopEase", $@"
        <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;'>
          <div style='background:linear-gradient(135deg,#00b894,#00cec9);padding:2rem;text-align:center;'>
            <h1 style='color:#fff;margin:0;'>Back in Stock!</h1>
            <p style='color:rgba(255,255,255,0.9);margin:0.5rem 0 0;'>You asked us to notify you</p>
          </div>
          <div style='padding:2rem;'>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Great news! <strong>{productName}</strong> is back in stock. Hurry — limited units available!</p>
            <div style='text-align:center;margin:2rem 0;'>
              <a href='https://shopease-rupesh.vercel.app/products/{productId}' style='display:inline-block;background:#00b894;color:#fff;text-decoration:none;padding:1rem 2.5rem;border-radius:12px;font-weight:700;font-size:1rem;'>Shop Now</a>
            </div>
          </div>
          <div style='background:#f7f8fc;padding:1rem 2rem;text-align:center;font-size:0.8rem;color:#888;'>
            ShopEase Pvt. Ltd. | support@shopease.in
          </div>
        </div>");

    private async Task SendAsync(string to, string subject, string htmlBody)
    {
        if (string.IsNullOrEmpty(_user))
        {
            logger.LogInformation("Email not configured. Would send to {To}: {Subject}", to, subject);
            return;
        }
        try
        {
            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_user, _pass)
            };
            var msg = new MailMessage
            {
                From = new MailAddress(_from, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(to);
            await client.SendMailAsync(msg);
            logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}", to);
        }
    }
}
