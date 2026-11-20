using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.DTOs;

public class MenuDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "menu";
    public string Path { get; set; } = string.Empty;
    public string? Component { get; set; }
    public string? Icon { get; set; }
    public string? Permission { get; set; }
    public int SortOrder { get; set; }
    public bool Visible { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreateTime { get; set; }
    public List<MenuDto> Children { get; set; } = new();
}

public class CreateMenuRequest
{
    public int? ParentId { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Type { get; set; } = "menu";

    [MaxLength(100)]
    public string Path { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Component { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; }

    [MaxLength(100)]
    public string? Permission { get; set; }

    public int SortOrder { get; set; }
    public bool Visible { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

public class UpdateMenuRequest : CreateMenuRequest { }

/// <summary>当前登录用户可见菜单树 + 权限标识</summary>
public class UserMenuResponse
{
    public List<MenuDto> Menus { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public bool IsAdmin { get; set; }
}