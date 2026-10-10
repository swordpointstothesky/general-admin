using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IChatService
{
    Task<List<ConversationDto>> GetMyConversationsAsync(int userId);
    Task<ConversationDto> CreateConversationAsync(int userId, CreateConversationRequest request);
    Task<ConversationDto?> GetConversationAsync(long id, int userId);
    Task<bool> DeleteConversationAsync(long id, int userId);
    Task<MessagePageResponse> GetMessagesAsync(long conversationId, int userId, long? beforeId, int pageSize);
    Task<MessageDto> SendMessageAsync(int userId, SendMessageRequest request);
    Task<bool> DeleteMessageAsync(long messageId, int userId);
    Task MarkReadAsync(int userId, long conversationId, long lastMessageId);
    Task<List<long>> GetUserConversationIdsAsync(int userId);
}