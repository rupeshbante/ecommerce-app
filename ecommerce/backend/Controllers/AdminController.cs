using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,Manager")]
public class AdminController(IDashboardService dashboard, AppDbContext db, IReturnService returnService, IAuditService auditService, IProductService productService) : ControllerBase
{
    private string UserEmail => User.FindFirstValue(ClaimTypes.Email) ?? "";
    private int? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) is string s ? int.Parse(s) : null;

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboard() =>
        Ok(await dashboard.GetStatsAsync());

    [HttpGet("report")]
    public async Task<ActionResult<SalesReportDto>> GetReport([FromQuery] int days = 30) =>
        Ok(await dashboard.GetSalesReportAsync(days));

    [HttpGet("products")]
    public async Task<ActionResult<PagedResultDto<ProductDto>>> GetAdminProducts(
        [FromQuery] string? category, [FromQuery] string? search, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await productService.GetAllForAdminAsync(category, search, isActive, page, pageSize));

    [HttpGet("orders")]
    public async Task<ActionResult<PagedResultDto<AdminOrderSummaryDto>>> GetOrders(
        [FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var all = await dashboard.GetAllOrdersAsync(status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            all = all.Where(o => o.CustomerName.Contains(s, StringComparison.OrdinalIgnoreCase)
                || o.CustomerEmail.Contains(s, StringComparison.OrdinalIgnoreCase)
                || o.Id.ToString().Contains(s)).ToList();
        }
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new PagedResultDto<AdminOrderSummaryDto>(all.Count, page, pageSize, items));
    }

    [HttpGet("orders/{id}")]
    public async Task<ActionResult<AdminOrderDetailDto>> GetOrder(int id)
    {
        var order = await dashboard.GetOrderDetailAsync(id);
        return order == null ? NotFound() : Ok(order);
    }

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var ok = await dashboard.UpdateOrderStatusAsync(id, dto.Status);
        if (ok) await auditService.LogAsync(UserId, UserEmail, "Update", "Order", id.ToString(), null, $"Status: {dto.Status}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("customers")]
    public async Task<ActionResult<PagedResultDto<AdminCustomerDto>>> GetCustomers(
        [FromQuery] string? search, [FromQuery] string? role, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var all = await dashboard.GetAllCustomersAsync();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            all = all.Where(c => c.FullName.Contains(s, StringComparison.OrdinalIgnoreCase)
                || c.Email.Contains(s, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(role)) all = all.Where(c => c.Role == role).ToList();
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new PagedResultDto<AdminCustomerDto>(all.Count, page, pageSize, items));
    }

    [HttpGet("customers/{id}")]
    public async Task<ActionResult<AdminCustomerDto>> GetCustomer(int id)
    {
        var c = await dashboard.GetCustomerAsync(id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpGet("customers/{id}/orders")]
    public async Task<ActionResult<List<AdminOrderSummaryDto>>> GetCustomerOrders(int id) =>
        Ok(await dashboard.GetCustomerOrdersAsync(id));

    [HttpPut("users/{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
    {
        var ok = await dashboard.UpdateUserRoleAsync(id, dto.Role);
        if (ok) await auditService.LogAsync(UserId, UserEmail, "RoleChange", "User", id.ToString(), null, $"Role: {dto.Role}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("upload-image")]
    public async Task<ActionResult<UploadImageResponseDto>> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file provided");
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext)) return BadRequest("File type not allowed");
        if (file.Length > 5 * 1024 * 1024) return BadRequest("File size exceeds 5MB");

        var dir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
        Directory.CreateDirectory(dir);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine(dir, fileName);
        using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        var url = $"{Request.Scheme}://{Request.Host}/images/products/{fileName}";
        return Ok(new UploadImageResponseDto(url));
    }

    // ── Returns Management ──────────────────────────────────────
    [HttpGet("returns")]
    public async Task<IActionResult> GetReturns(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var all = await returnService.GetAllReturnRequestsAsync(status);
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new PagedResultDto<ReturnRequestDto>(all.Count, page, pageSize, items));
    }

    [HttpPut("returns/{id}/status")]
    public async Task<IActionResult> UpdateReturnStatus(int id, [FromBody] UpdateReturnStatusDto dto)
    {
        var ok = await returnService.UpdateReturnStatusAsync(id, dto);
        if (ok) await auditService.LogAsync(UserId, UserEmail, "Update", "ReturnRequest", id.ToString(), null, $"Status: {dto.Status}", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");
        return ok ? NoContent() : NotFound();
    }

    // ── Audit Logs ─────────────────────────────────────────────
    [HttpGet("audit-logs"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var total = await db.AuditLogs.CountAsync();
        var logs = await db.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(l => new { l.Id, l.UserEmail, l.Action, l.Entity, l.EntityId, l.NewValues, l.IpAddress, l.CreatedAt })
            .ToListAsync();
        return Ok(new { total, page, pageSize, data = logs });
    }

    // ── Sales Export (CSV) ──────────────────────────────────────
    [HttpGet("export/sales-csv")]
    public async Task<IActionResult> ExportSalesCsv([FromQuery] int days = 30)
    {
        var from = DateTime.UtcNow.AddDays(-days);
        var orders = await db.Orders
            .Where(o => o.OrderDate >= from)
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Order ID,Customer Name,Customer Email,Order Date,Status,Total Amount,Items Count,Shipping Address");

        foreach (var o in orders)
            csv.AppendLine($"{o.Id},{EscapeCsv(o.User.FullName)},{EscapeCsv(o.User.Email)},{o.OrderDate:dd MMM yyyy},{o.Status},{o.TotalAmount:N2},{o.OrderItems.Count},{EscapeCsv(o.ShippingAddress)}");

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"sales_report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // ── Products Export (CSV) ──────────────────────────────────
    [HttpGet("export/products-csv")]
    public async Task<IActionResult> ExportProductsCsv()
    {
        var products = await db.Products.Where(p => p.IsActive).ToListAsync();
        var csv = new StringBuilder();
        csv.AppendLine("ID,Name,Description,Price,Stock,Category,ImageUrl,Active");
        foreach (var p in products)
            csv.AppendLine($"{p.Id},{EscapeCsv(p.Name)},{EscapeCsv(p.Description)},{p.Price:N2},{p.Stock},{EscapeCsv(p.Category)},{EscapeCsv(p.ImageUrl)},{p.IsActive}");

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"products_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // ── Low Stock Summary ─────────────────────────────────────
    [HttpGet("low-stock-summary")]
    public async Task<IActionResult> GetLowStockSummary() =>
        Ok(await db.Products.Where(p => p.IsActive && p.Stock <= p.LowStockThreshold)
            .Select(p => new { p.Id, p.Name, p.Stock, p.LowStockThreshold, p.Category })
            .OrderBy(p => p.Stock).ToListAsync());

    private static string EscapeCsv(string value) =>
        value.Contains(',') || value.Contains('"') || value.Contains('\n')
            ? $"\"{value.Replace("\"", "\"\"")}\"" : value;
}
