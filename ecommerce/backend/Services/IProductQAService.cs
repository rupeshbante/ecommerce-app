using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IProductQAService
{
    Task<List<ProductQuestionDto>> GetForProductAsync(int productId);
    Task<ProductQuestionDto> AskAsync(int userId, CreateQuestionDto dto);
    Task<ProductQuestionDto?> AnswerAsync(int userId, int questionId, CreateAnswerDto dto);
    Task<bool> DeleteQuestionAsync(int questionId, int userId, bool isAdminOrManager);
}
