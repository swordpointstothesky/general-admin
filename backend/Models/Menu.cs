using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Menu
{
    public int Id { get; set; }

    public int? ParentId { get; set; }
    public Menu? Parent { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Path { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Icon { get; set; }

    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;

    public ICollection<Menu> Children { get; set; } = new List<Menu>();
    public ICollection<RoleMenu> RoleMenus { get; set; } = new List<RoleMenu>();
}