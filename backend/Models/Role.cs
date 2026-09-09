using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class Role
{
    public int Id { get; set; }
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Description { get; set; }
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // 多对多：一个角色可以有多个用户
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    // 角色-权限多对多
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    public ICollection<RoleMenu> RoleMenus { get; set; } = new List<RoleMenu>();
}