using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Permission
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;
    [MaxLength(50)]
    public string? Category { get; set; }
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}