namespace GeneralAdmin.Backend.DTOs;

public class ConversationDto
{
    public long Id { get; set; }
    public string Type { get; set; } = "single";
    public string? Name { get; set; }
    public ChatUserDto? Peer { get; set; }
    public List<ChatUserDto> Members { get; set; } = new();
    public string? LastMessageContent { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}

public class ChatUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}

public class MessageDto
{
    public long Id { get; set; }
    public long ConversationId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatar { get; set; }
    public string ContentType { get; set; } = "text";
    public string? Content { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public DateTime CreateTime { get; set; }
}

public class SendMessageRequest
{
    public long ConversationId { get; set; }
    public string ContentType { get; set; } = "text";
    public string? Content { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
}

public class CreateConversationRequest
{
    public int? PeerUserId { get; set; }
    public List<int>? MemberIds { get; set; }
    public string? Name { get; set; }
}

public class MessagePageResponse
{
    public List<MessageDto> Items { get; set; } = new();
    public bool HasMore { get; set; }
}