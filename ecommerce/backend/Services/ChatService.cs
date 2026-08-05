using Anthropic;
using Anthropic.Models.Messages;
using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ChatService(AppDbContext db, IConfiguration config, ILogger<ChatService> logger) : IChatService
{
    private readonly string _apiKey = config["Anthropic:ApiKey"] ?? "";

    private const string SystemPrompt = @"You are ShopEase's customer support assistant. ShopEase is an online store selling a wide range of products.

You know about these ShopEase features and policies:
- Orders: customers can track order status (Pending, Processing, Shipped, Delivered, Cancelled) on the My Orders page.
- Returns: customers can request a return from their order details within the return window; approved returns are refunded within 5-7 business days after the item is received.
- Loyalty points: customers earn points on delivered orders and can redeem them for discounts at checkout; points balance is shown on their Profile page.
- Referrals: customers have a referral code on their Profile page; when a friend signs up and applies it, both the referrer and the new customer receive loyalty points.
- Guest checkout: customers can check out without creating an account.
- Product Q&A: customers can ask questions on a product page and see answers from other customers or store staff.

Be friendly and concise. Never invent specific facts you don't have access to (like a specific order's exact status, live stock levels, or exact prices) — instead point the customer to the relevant page (My Orders, Returns, Profile, the product page). If asked something unrelated to ShopEase or shopping, politely redirect the conversation back to how you can help with their shopping experience.";

    public async Task<ChatMessageDto> SendMessageAsync(int userId, string userMessage)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            logger.LogInformation("Anthropic API not configured. Would reply to user {UserId}", userId);
            return await PersistExchangeAsync(userId, userMessage,
                "Chat support isn't set up yet — please email support@shopease.in and our team will help you out.");
        }

        try
        {
            var history = await db.ChatMessages
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Take(20)
                .ToListAsync();
            history.Reverse();

            var messages = history
                .Select(m => new MessageParam
                {
                    Role = m.Role == "assistant" ? Role.Assistant : Role.User,
                    Content = m.Content
                })
                .ToList();
            messages.Add(new MessageParam { Role = Role.User, Content = userMessage });

            var client = new AnthropicClient { ApiKey = _apiKey };
            var parameters = new MessageCreateParams
            {
                Model = Model.ClaudeOpus5,
                MaxTokens = 1024,
                System = SystemPrompt,
                Messages = messages
            };

            var response = await client.Messages.Create(parameters);

            var replyText = "";
            foreach (var block in response.Content)
            {
                if (block.TryPickText(out var textBlock))
                    replyText += textBlock.Text;
            }
            if (string.IsNullOrWhiteSpace(replyText))
                replyText = "Sorry, I didn't quite catch that — could you rephrase?";

            return await PersistExchangeAsync(userId, userMessage, replyText);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Anthropic chat call failed for user {UserId}", userId);
            return await PersistExchangeAsync(userId, userMessage,
                "Something went wrong on our end — please try again in a moment.");
        }
    }

    private async Task<ChatMessageDto> PersistExchangeAsync(int userId, string userMessage, string reply)
    {
        db.ChatMessages.Add(new ChatMessage { UserId = userId, Role = "user", Content = userMessage });
        var assistantMessage = new ChatMessage { UserId = userId, Role = "assistant", Content = reply };
        db.ChatMessages.Add(assistantMessage);
        await db.SaveChangesAsync();

        return new ChatMessageDto(assistantMessage.Id, assistantMessage.Role, assistantMessage.Content, assistantMessage.CreatedAt);
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(int userId) =>
        await db.ChatMessages.Where(c => c.UserId == userId)
            .OrderBy(c => c.CreatedAt).Take(50)
            .Select(c => new ChatMessageDto(c.Id, c.Role, c.Content, c.CreatedAt))
            .ToListAsync();
}
