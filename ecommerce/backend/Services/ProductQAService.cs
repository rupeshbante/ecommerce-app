using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class ProductQAService(AppDbContext db) : IProductQAService
{
    public async Task<List<ProductQuestionDto>> GetForProductAsync(int productId)
    {
        var questions = await db.ProductQuestions.Where(q => q.ProductId == productId)
            .Include(q => q.User)
            .Include(q => q.Answers).ThenInclude(a => a.User)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();
        return questions.Select(MapQuestion).ToList();
    }

    public async Task<ProductQuestionDto> AskAsync(int userId, CreateQuestionDto dto)
    {
        var question = new ProductQuestion { ProductId = dto.ProductId, UserId = userId, Question = dto.Question };
        db.ProductQuestions.Add(question);
        await db.SaveChangesAsync();
        return await MapQuestionAsync(question.Id);
    }

    public async Task<ProductQuestionDto?> AnswerAsync(int userId, int questionId, CreateAnswerDto dto)
    {
        var question = await db.ProductQuestions.FirstOrDefaultAsync(q => q.Id == questionId);
        if (question == null) return null;
        db.ProductAnswers.Add(new ProductAnswer { ProductQuestionId = questionId, UserId = userId, Answer = dto.Answer });
        await db.SaveChangesAsync();
        return await MapQuestionAsync(questionId);
    }

    public async Task<bool> DeleteQuestionAsync(int questionId, int userId, bool isAdminOrManager)
    {
        var question = await db.ProductQuestions.FirstOrDefaultAsync(q => q.Id == questionId);
        if (question == null) return false;
        if (!isAdminOrManager && question.UserId != userId) return false;
        db.ProductQuestions.Remove(question);
        await db.SaveChangesAsync();
        return true;
    }

    private async Task<ProductQuestionDto> MapQuestionAsync(int id)
    {
        var question = await db.ProductQuestions.Where(q => q.Id == id)
            .Include(q => q.User)
            .Include(q => q.Answers).ThenInclude(a => a.User)
            .FirstAsync();
        return MapQuestion(question);
    }

    private static ProductQuestionDto MapQuestion(ProductQuestion q) => new(
        q.Id, q.ProductId, q.User.FullName, q.Question, q.CreatedAt,
        q.Answers.OrderBy(a => a.CreatedAt)
            .Select(a => new ProductAnswerDto(a.Id, a.User.FullName, a.Answer, a.CreatedAt)).ToList()
    );
}
