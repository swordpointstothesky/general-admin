namespace GeneralAdmin.Backend.Models;

public class ConversationMember
{
    public long Id { get; set; }
    public long ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public long? LastReadMessageId { get; set; }
    public DateTime JoinTime { get; set; } = DateTime.UtcNow;
}