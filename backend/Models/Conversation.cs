using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Conversation
{
    public long Id { get; set; }

    [Required, MaxLength(20)]
    public string Type { get; set; } = "single";

    [MaxLength(100)]
    public string? Name { get; set; }

    public string? LastMessageContent { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;

    public ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}