namespace ECommerceAPI.DTOs;

public record CreateAddressDto(
    string Label,
    string FullName,
    string Phone,
    string AddressLine1,
    string AddressLine2,
    string City,
    string State,
    string Pincode,
    bool IsDefault
);

public record UpdateAddressDto(
    string Label,
    string FullName,
    string Phone,
    string AddressLine1,
    string AddressLine2,
    string City,
    string State,
    string Pincode,
    bool IsDefault
);

public record AddressDto(
    int Id,
    string Label,
    string FullName,
    string Phone,
    string AddressLine1,
    string AddressLine2,
    string City,
    string State,
    string Pincode,
    bool IsDefault
);
