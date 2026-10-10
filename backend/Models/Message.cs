using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Message
{
    public long Id { get; set; }
    public long ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;

    [Required, MaxLength(20)]
    public string ContentType { get; set; } = "text";

    public string? Content { get; set; }

    [MaxLength(500)]
    public string? FileUrl { get; set; }

    [MaxLength(255)]
    public string? FileName { get; set; }

    public long? FileSize { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
}