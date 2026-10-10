using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Notification
{
    public long Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Type { get; set; } = "info";   // info / success / warning / error

    [MaxLength(500)]
    public string? Link { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime? ReadTime { get; set; }
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
}