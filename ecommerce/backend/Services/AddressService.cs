using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;

namespace ECommerceAPI.Services;

public class AddressService(AppDbContext db) : IAddressService
{
    public async Task<List<AddressDto>> GetAddressesAsync(int userId) =>
        await db.UserAddresses.Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt)
            .Select(a => MapAddress(a)).ToListAsync();

    public async Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto)
    {
        if (dto.IsDefault)
            await ClearDefaultAsync(userId);

        var address = new UserAddress
        {
            UserId = userId, Label = dto.Label, FullName = dto.FullName,
            Phone = dto.Phone, AddressLine1 = dto.AddressLine1, AddressLine2 = dto.AddressLine2,
            City = dto.City, State = dto.State, Pincode = dto.Pincode, IsDefault = dto.IsDefault
        };
        db.UserAddresses.Add(address);
        await db.SaveChangesAsync();
        return MapAddress(address);
    }

    public async Task<AddressDto?> UpdateAddressAsync(int addressId, int userId, UpdateAddressDto dto)
    {
        var address = await db.UserAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);
        if (address == null) return null;

        if (dto.IsDefault) await ClearDefaultAsync(userId);

        address.Label = dto.Label; address.FullName = dto.FullName; address.Phone = dto.Phone;
        address.AddressLine1 = dto.AddressLine1; address.AddressLine2 = dto.AddressLine2;
        address.City = dto.City; address.State = dto.State; address.Pincode = dto.Pincode;
        address.IsDefault = dto.IsDefault;
        await db.SaveChangesAsync();
        return MapAddress(address);
    }

    public async Task<bool> DeleteAddressAsync(int addressId, int userId)
    {
        var address = await db.UserAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);
        if (address == null) return false;
        db.UserAddresses.Remove(address);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetDefaultAsync(int addressId, int userId)
    {
        var address = await db.UserAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);
        if (address == null) return false;
        await ClearDefaultAsync(userId);
        address.IsDefault = true;
        await db.SaveChangesAsync();
        return true;
    }

    private async Task ClearDefaultAsync(int userId)
    {
        var defaults = await db.UserAddresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
        defaults.ForEach(a => a.IsDefault = false);
    }

    private static AddressDto MapAddress(UserAddress a) =>
        new(a.Id, a.Label, a.FullName, a.Phone, a.AddressLine1, a.AddressLine2, a.City, a.State, a.Pincode, a.IsDefault);
}
