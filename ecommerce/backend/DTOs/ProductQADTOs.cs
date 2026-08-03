namespace ECommerceAPI.DTOs;

public record CreateQuestionDto(int ProductId, string Question);
public record CreateAnswerDto(string Answer);

public record ProductAnswerDto(int Id, string AnswererName, string Answer, DateTime CreatedAt);

public record ProductQuestionDto(
    int Id, int ProductId, string AskerName, string Question, DateTime CreatedAt,
    List<ProductAnswerDto> Answers
);
