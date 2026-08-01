using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/coupons")]
public class CouponsController(ICouponService couponService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PagedResultDto<CouponDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var all = await couponService.GetAllAsync();
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new PagedResultDto<CouponDto>(all.Count, page, pageSize, items));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<CouponDto>> GetById(int id)
    {
        var c = await couponService.GetByIdAsync(id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<CouponDto>> Create([FromBody] CreateCouponDto dto) =>
        CreatedAtAction(nameof(GetById), new { id = 0 }, await couponService.CreateAsync(dto));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<CouponDto>> Update(int id, [FromBody] UpdateCouponDto dto)
    {
        var c = await couponService.UpdateAsync(id, dto);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await couponService.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("validate/{code}")]
    [Authorize]
    public async Task<IActionResult> Validate(string code, [FromQuery] decimal amount = 0)
        => Ok(await couponService.ValidateAsync(code, amount));
}
