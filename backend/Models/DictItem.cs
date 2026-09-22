using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class DictItem
{
    public int Id { get; set; }

    public int DictTypeId { get; set; }
    public DictType DictType { get; set; } = null!;

    [Required, MaxLength(50)]
    public string Label { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Value { get; set; } = string.Empty;

    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
}