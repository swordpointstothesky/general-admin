using System.Security.Claims;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException();
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool unreadOnly = false)
    {
        var result = await _service.GetMyNotificationsAsync(GetUserId(), page, pageSize, unreadOnly);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _service.GetUnreadCountAsync(GetUserId());
        return Ok(new { count });
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(long id)
    {
        var result = await _service.MarkAsReadAsync(id, GetUserId());
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var count = await _service.MarkAllAsReadAsync(GetUserId());
        return Ok(new { count });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _service.DeleteAsync(id, GetUserId());
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAll()
    {
        var count = await _service.ClearAllAsync(GetUserId());
        return Ok(new { count });
    }

    // ========== 管理员接口 ==========

    /// <summary>发布通知（管理员）</summary>
    [HttpPost("publish")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish([FromBody] PublishNotificationRequest request)
    {
        try
        {
            var count = await _service.PublishAsync(request);
            return Ok(new { count, message = $"已发送给 {count} 位用户" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>查看所有通知（管理员）</summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        return Ok(await _service.GetAllAsync(page, pageSize));
    }
}