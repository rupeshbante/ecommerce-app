using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ECommerceAPI.Hubs;

public class NotificationHub : Hub
{
    [Authorize]
    public async Task JoinUserGroup(string userId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

    [Authorize]
    public async Task LeaveUserGroup(string userId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

    // Anonymous: order id + email is already the access check for guest order tracking,
    // so joining this group needs no auth — it only carries live status pushes, no PII.
    public async Task JoinOrderGroup(int orderId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderId}");

    public async Task LeaveOrderGroup(int orderId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderId}");
}
