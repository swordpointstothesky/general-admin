using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GeneralAdmin.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MenusController : ControllerBase
{
    private readonly IMenuService _menuService;
    public MenusController(IMenuService menuService) => _menuService = menuService;

    /// <summary>当前登录用户菜单树 + 权限标识</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyMenus()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "无法识别当前用户" });
        return Ok(await _menuService.GetUserMenusAsync(userId));
    }

    /// <summary>管理端整棵树</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? type,
        [FromQuery] bool? isActive)
        => Ok(await _menuService.GetMenuTreeAsync(keyword, type, isActive));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var m = await _menuService.GetMenuByIdAsync(id);
        return m == null ? NotFound() : Ok(m);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMenuRequest request)
    {
        try { return Ok(await _menuService.CreateMenuAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuRequest request)
    {
        try { return await _menuService.UpdateMenuAsync(id, request) ? NoContent() : NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => await _menuService.DeleteMenuAsync(id) ? NoContent() : NotFound();
}