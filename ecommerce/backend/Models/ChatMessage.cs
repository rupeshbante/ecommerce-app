namespace ECommerceAPI.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public string? GuestSessionId { get; set; } // client-generated id correlating an anonymous visitor's messages
    public string Role { get; set; } = "user"; // user, assistant
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
