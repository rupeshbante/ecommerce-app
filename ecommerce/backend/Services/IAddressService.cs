using ECommerceAPI.DTOs;

namespace ECommerceAPI.Services;

public interface IAddressService
{
    Task<List<AddressDto>> GetAddressesAsync(int userId);
    Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto);
    Task<AddressDto?> UpdateAddressAsync(int addressId, int userId, UpdateAddressDto dto);
    Task<bool> DeleteAddressAsync(int addressId, int userId);
    Task<bool> SetDefaultAsync(int addressId, int userId);
}
