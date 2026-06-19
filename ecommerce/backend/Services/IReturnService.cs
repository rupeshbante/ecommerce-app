using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IReturnService
{
    Task<ReturnRequestDto?> CreateReturnRequestAsync(int userId, CreateReturnRequestDto dto);
    Task<List<ReturnRequestDto>> GetUserReturnRequestsAsync(int userId);
    Task<List<ReturnRequestDto>> GetAllReturnRequestsAsync(string? status);
    Task<bool> UpdateReturnStatusAsync(int returnId, UpdateReturnStatusDto dto);
}
