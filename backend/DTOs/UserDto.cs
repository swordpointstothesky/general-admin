namespace GeneralAdmin.Backend.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreateTime { get; set; }
    public bool IsActive { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool? IsActive { get; set; }
    public List<int> RoleIds { get; set; } = new();
}

public class UpdateUserRequest
{
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? Email { get; set; }
    public bool? IsActive { get; set; }
    public List<int> RoleIds { get; set; } = new();
}