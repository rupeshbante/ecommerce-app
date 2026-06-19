using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ReturnService(AppDbContext db, IEmailService emailService) : IReturnService
{
    public async Task<ReturnRequestDto?> CreateReturnRequestAsync(int userId, CreateReturnRequestDto dto)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);
        if (order == null || order.Status != "Delivered") return null;

        var existing = await db.ReturnRequests.AnyAsync(r => r.OrderId == dto.OrderId);
        if (existing) return null;

        var req = new ReturnRequest
        {
            OrderId = dto.OrderId, UserId = userId,
            Reason = dto.Reason, Description = dto.Description
        };
        db.ReturnRequests.Add(req);
        await db.SaveChangesAsync();

        return MapReturn(req);
    }

    public async Task<List<ReturnRequestDto>> GetUserReturnRequestsAsync(int userId) =>
        await db.ReturnRequests.Where(r => r.UserId == userId)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => MapReturn(r)).ToListAsync();

    public async Task<List<ReturnRequestDto>> GetAllReturnRequestsAsync(string? status) =>
        await db.ReturnRequests
            .Where(r => status == null || r.Status == status)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => MapReturn(r)).ToListAsync();

    public async Task<bool> UpdateReturnStatusAsync(int returnId, UpdateReturnStatusDto dto)
    {
        var req = await db.ReturnRequests.Include(r => r.User).FirstOrDefaultAsync(r => r.Id == returnId);
        if (req == null) return false;

        req.Status = dto.Status;
        req.AdminNote = dto.AdminNote;
        req.ProcessedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (dto.Status == "Approved")
            await emailService.SendReturnApprovedAsync(req.User.Email, req.User.FullName, req.Id);

        return true;
    }

    private static ReturnRequestDto MapReturn(ReturnRequest r) =>
        new(r.Id, r.OrderId, r.Reason, r.Description, r.Status, r.AdminNote, r.RequestedAt, r.ProcessedAt);
}
