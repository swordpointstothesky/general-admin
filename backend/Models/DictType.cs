using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class DictType
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    /// <summary>
    /// 归属菜单（NULL 表示通用字典）
    /// </summary>
    public int? MenuId { get; set; }
    public Menu? Menu { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;

    public ICollection<DictItem> Items { get; set; } = new List<DictItem>();
}