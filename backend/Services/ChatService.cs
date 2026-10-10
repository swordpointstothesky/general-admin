using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _context;

    public ChatService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ConversationDto>> GetMyConversationsAsync(int userId)
    {
        var memberships = await _context.ConversationMembers
            .Where(cm => cm.UserId == userId)
            .Include(cm => cm.Conversation)
                .ThenInclude(c => c.Members)
                    .ThenInclude(m => m.User)
            .OrderByDescending(cm => cm.Conversation.LastMessageTime)
            .ToListAsync();

        var result = new List<ConversationDto>();

        foreach (var cm in memberships)
        {
            var conv = cm.Conversation;
            var unread = await _context.Messages
                .Where(m => m.ConversationId == conv.Id
                         && !m.IsDeleted
                         && (cm.LastReadMessageId == null || m.Id > cm.LastReadMessageId))
                .CountAsync();

            var dto = new ConversationDto
            {
                Id = conv.Id,
                Type = conv.Type,
                Name = conv.Name,
                LastMessageContent = conv.LastMessageContent,
                LastMessageTime = conv.LastMessageTime,
                UnreadCount = unread,
            };

            if (conv.Type == "single")
            {
                var peer = conv.Members.FirstOrDefault(m => m.UserId != userId)?.User;
                if (peer != null)
                {
                    dto.Peer = new ChatUserDto
                    {
                        Id = peer.Id,
                        Username = peer.Username,
                        Avatar = peer.Avatar,
                    };
                }
            }
            else
            {
                dto.Members = conv.Members
                    .Where(m => m.UserId != userId)
                    .Select(m => new ChatUserDto
                    {
                        Id = m.User.Id,
                        Username = m.User.Username,
                        Avatar = m.User.Avatar,
                    })
                    .ToList();
            }

            result.Add(dto);
        }

        return result;
    }

    public async Task<ConversationDto> CreateConversationAsync(int userId, CreateConversationRequest request)
    {
        // ===== 单聊 =====
        if (request.PeerUserId.HasValue)
        {
            if (request.PeerUserId.Value == userId)
                throw new InvalidOperationException("不能和自己聊天");

            var existing = await _context.Conversations
                .Where(c => c.Type == "single")
                .Where(c => c.Members.Any(m => m.UserId == userId)
                         && c.Members.Any(m => m.UserId == request.PeerUserId.Value))
                .Where(c => c.Members.Count() == 2)
                .FirstOrDefaultAsync();

            if (existing != null)
                return (await GetConversationAsync(existing.Id, userId))!;

            var conversation = new Conversation { Type = "single" };
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            _context.ConversationMembers.AddRange(
                new ConversationMember { ConversationId = conversation.Id, UserId = userId },
                new ConversationMember { ConversationId = conversation.Id, UserId = request.PeerUserId.Value }
            );
            await _context.SaveChangesAsync();

            return (await GetConversationAsync(conversation.Id, userId))!;
        }

        // ===== 群聊 =====
        if (request.MemberIds == null || request.MemberIds.Count < 2)
            throw new InvalidOperationException("群聊至少需要 2 个成员");

        var memberIds = request.MemberIds.Distinct().ToList();
        if (!memberIds.Contains(userId)) memberIds.Add(userId);

        var group = new Conversation
        {
            Type = "group",
            Name = request.Name ?? "群聊",
        };
        _context.Conversations.Add(group);
        await _context.SaveChangesAsync();

        foreach (var memberId in memberIds)
        {
            _context.ConversationMembers.Add(new ConversationMember
            {
                ConversationId = group.Id,
                UserId = memberId,
            });
        }
        await _context.SaveChangesAsync();

        return (await GetConversationAsync(group.Id, userId))!;
    }

    public async Task<ConversationDto?> GetConversationAsync(long id, int userId)
    {
        var isMember = await _context.ConversationMembers
            .AnyAsync(cm => cm.ConversationId == id && cm.UserId == userId);
        if (!isMember) return null;

        var list = await GetMyConversationsAsync(userId);
        return list.FirstOrDefault(c => c.Id == id);
    }

    public async Task<bool> DeleteConversationAsync(long id, int userId)
    {
        var member = await _context.ConversationMembers
            .FirstOrDefaultAsync(cm => cm.ConversationId == id && cm.UserId == userId);
        if (member == null) return false;

        _context.ConversationMembers.Remove(member);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<MessagePageResponse> GetMessagesAsync(
        long conversationId, int userId, long? beforeId, int pageSize)
    {
        var isMember = await _context.ConversationMembers
            .AnyAsync(cm => cm.ConversationId == conversationId && cm.UserId == userId);
        if (!isMember) throw new InvalidOperationException("无权访问该会话");

        var query = _context.Messages
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

        if (beforeId.HasValue)
            query = query.Where(m => m.Id < beforeId.Value);

        var messages = await query
            .OrderByDescending(m => m.Id)
            .Take(pageSize + 1)
            .Include(m => m.Sender)
            .ToListAsync();

        var hasMore = messages.Count > pageSize;
        if (hasMore) messages = messages.Take(pageSize).ToList();
        messages.Reverse();

        return new MessagePageResponse
        {
            HasMore = hasMore,
            Items = messages.Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.Username,
                SenderAvatar = m.Sender.Avatar,
                ContentType = m.ContentType,
                Content = m.Content,
                FileUrl = m.FileUrl,
                FileName = m.FileName,
                FileSize = m.FileSize,
                CreateTime = m.CreateTime,
            }).ToList()
        };
    }

    public async Task<MessageDto> SendMessageAsync(int userId, SendMessageRequest request)
    {
        var isMember = await _context.ConversationMembers
            .AnyAsync(cm => cm.ConversationId == request.ConversationId && cm.UserId == userId);
        if (!isMember) throw new InvalidOperationException("无权发送消息");

        var message = new Message
        {
            ConversationId = request.ConversationId,
            SenderId = userId,
            ContentType = request.ContentType,
            Content = request.Content,
            FileUrl = request.FileUrl,
            FileName = request.FileName,
            FileSize = request.FileSize,
            CreateTime = DateTime.UtcNow,
        };
        _context.Messages.Add(message);

        var conversation = await _context.Conversations.FindAsync(request.ConversationId);
        if (conversation != null)
        {
            conversation.LastMessageContent = request.ContentType switch
            {
                "image" => "[图片]",
                "file" => $"[文件] {request.FileName}",
                _ => request.Content,
            };
            conversation.LastMessageTime = message.CreateTime;
        }

        await _context.SaveChangesAsync();

        var sender = await _context.Users.FindAsync(userId);

        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = sender?.Username ?? "未知",
            SenderAvatar = sender?.Avatar,
            ContentType = message.ContentType,
            Content = message.Content,
            FileUrl = message.FileUrl,
            FileName = message.FileName,
            FileSize = message.FileSize,
            CreateTime = message.CreateTime,
        };
    }

    public async Task<bool> DeleteMessageAsync(long messageId, int userId)
    {
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == userId);
        if (message == null) return false;

        message.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task MarkReadAsync(int userId, long conversationId, long lastMessageId)
    {
        var member = await _context.ConversationMembers
            .FirstOrDefaultAsync(cm => cm.ConversationId == conversationId && cm.UserId == userId);
        if (member == null) return;

        member.LastReadMessageId = lastMessageId;
        await _context.SaveChangesAsync();
    }

    public async Task<List<long>> GetUserConversationIdsAsync(int userId)
    {
        return await _context.ConversationMembers
            .Where(cm => cm.UserId == userId)
            .Select(cm => cm.ConversationId)
            .ToListAsync();
    }
}