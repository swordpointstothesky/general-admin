using System.Security.Claims;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GeneralAdmin.Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    private int GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : throw new HubException("未登录");
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var conversationIds = await _chatService.GetUserConversationIdsAsync(userId);

        foreach (var convId in conversationIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{convId}");
        }

        await base.OnConnectedAsync();
    }

    public async Task<MessageDto> SendMessage(SendMessageRequest request)
    {
        var userId = GetUserId();
        var message = await _chatService.SendMessageAsync(userId, request);

        await Clients.Group($"conv_{request.ConversationId}")
            .SendAsync("ReceiveMessage", message);

        return message;
    }

    public async Task Typing(long conversationId)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup($"conv_{conversationId}")
            .SendAsync("UserTyping", new { conversationId, userId });
    }

    public async Task MarkRead(long conversationId, long lastMessageId)
    {
        var userId = GetUserId();
        await _chatService.MarkReadAsync(userId, conversationId, lastMessageId);
        await Clients.OthersInGroup($"conv_{conversationId}")
            .SendAsync("UserRead", new { conversationId, userId, lastMessageId });
    }

    public async Task JoinConversation(long conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
    }
}