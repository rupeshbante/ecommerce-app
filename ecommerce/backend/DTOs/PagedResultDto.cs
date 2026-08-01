namespace ECommerceAPI.DTOs;

public record PagedResultDto<T>(int Total, int Page, int PageSize, List<T> Data);
