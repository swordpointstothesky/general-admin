using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.DTOs;

public class NotificationDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadTime { get; set; }
    public DateTime CreateTime { get; set; }
}

public class NotificationPageResponse
{
    public List<NotificationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class CreateNotificationRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? Link { get; set; }
}
public class PublishNotificationRequest
{
    [Required(ErrorMessage = "标题不能为空")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "内容不能为空")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Type { get; set; } = "info";

    [MaxLength(500)]
    public string? Link { get; set; }

    /// <summary>接收人 ID 列表。为空时表示发给所有人</summary>
    public List<int>? UserIds { get; set; }

    /// <summary>是否发给所有人</summary>
    public bool SendToAll { get; set; }
}