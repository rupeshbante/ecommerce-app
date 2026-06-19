namespace ECommerceAPI.DTOs;

public record CreateReturnRequestDto(int OrderId, string Reason, string Description);

public record ReturnRequestDto(
    int Id,
    int OrderId,
    string Reason,
    string Description,
    string Status,
    string AdminNote,
    DateTime RequestedAt,
    DateTime? ProcessedAt
);

public record UpdateReturnStatusDto(string Status, string AdminNote);
