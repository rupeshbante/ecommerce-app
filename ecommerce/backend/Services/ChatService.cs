using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ChatService(AppDbContext db, HttpClient http, IConfiguration config, ILogger<ChatService> logger) : IChatService
{
    private readonly string _apiKey = config["Gemini:ApiKey"] ?? "";
    private readonly string _model = config["Gemini:Model"] ?? "gemini-2.0-flash";

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
            logger.LogInformation("Gemini API not configured. Would reply to user {UserId}", userId);
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

            var contents = history
                .Select(m => new
                {
                    role = m.Role == "assistant" ? "model" : "user",
                    parts = new[] { new { text = m.Content } }
                })
                .ToList();
            contents.Add(new { role = "user", parts = new[] { new { text = userMessage } } });

            var payload = new
            {
                system_instruction = new { parts = new[] { new { text = SystemPrompt } } },
                contents,
                generationConfig = new { maxOutputTokens = 1024 }
            };

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent");
            request.Headers.Add("x-goog-api-key", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await http.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Gemini API error {Status}: {Body}", response.StatusCode, responseBody);
                return await PersistExchangeAsync(userId, userMessage,
                    "Something went wrong on our end — please try again in a moment.");
            }

            var replyText = ExtractReplyText(responseBody);
            if (string.IsNullOrWhiteSpace(replyText))
                replyText = "Sorry, I didn't quite catch that — could you rephrase?";

            return await PersistExchangeAsync(userId, userMessage, replyText);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gemini chat call failed for user {UserId}", userId);
            return await PersistExchangeAsync(userId, userMessage,
                "Something went wrong on our end — please try again in a moment.");
        }
    }

    private static string ExtractReplyText(string responseBody)
    {
        using var doc = JsonDocument.Parse(responseBody);
        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            return "";

        var sb = new StringBuilder();
        var content = candidates[0].GetProperty("content");
        if (content.TryGetProperty("parts", out var parts))
        {
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textEl))
                    sb.Append(textEl.GetString());
            }
        }
        return sb.ToString();
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
