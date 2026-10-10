using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreateTime { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "用户名不能为空")]
    [MinLength(3, ErrorMessage = "用户名至少 3 个字符")]
    [MaxLength(50, ErrorMessage = "用户名不能超过 50 个字符")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(6, ErrorMessage = "密码至少 6 个字符")]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [MaxLength(100)]
    public string? Email { get; set; }

    public bool? IsActive { get; set; }

    public List<int> RoleIds { get; set; } = new();
}

public class UpdateUserRequest
{
    [MaxLength(50)]
    public string? Username { get; set; }

    [MinLength(6, ErrorMessage = "密码至少 6 个字符")]
    public string? Password { get; set; }

    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string? Email { get; set; }

    public bool? IsActive { get; set; }

    public List<int>? RoleIds { get; set; }
}