using System.Security.Claims;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IUserService _userService;

    public ChatController(IChatService chatService, IUserService userService)
    {
        _chatService = chatService;
        _userService = userService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException();
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        return Ok(await _chatService.GetMyConversationsAsync(GetUserId()));
    }

    [HttpGet("conversations/{id}")]
    public async Task<IActionResult> GetConversation(long id)
    {
        var result = await _chatService.GetConversationAsync(id, GetUserId());
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
    {
        try
        {
            return Ok(await _chatService.CreateConversationAsync(GetUserId(), request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("conversations/{id}")]
    public async Task<IActionResult> DeleteConversation(long id)
    {
        var ok = await _chatService.DeleteConversationAsync(id, GetUserId());
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("conversations/{id}/messages")]
    public async Task<IActionResult> GetMessages(
        long id, [FromQuery] long? beforeId, [FromQuery] int pageSize = 30)
    {
        try
        {
            return Ok(await _chatService.GetMessagesAsync(id, GetUserId(), beforeId, pageSize));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage(long id)
    {
        var ok = await _chatService.DeleteMessageAsync(id, GetUserId());
        return ok ? NoContent() : NotFound();
    }

    /// <summary>获取可聊天用户列表（排除自己）</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetChatUsers()
    {
        var currentUserId = GetUserId();
        var users = await _userService.GetUsersAsync();
        var result = users
            .Where(u => u.Id != currentUserId)
            .Select(u => new ChatUserDto
            {
                Id = u.Id,
                Username = u.Username,
                Avatar = u.Avatar,
            })
            .ToList();
        return Ok(result);
    }
}