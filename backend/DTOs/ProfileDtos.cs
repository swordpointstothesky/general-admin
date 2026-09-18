namespace GeneralAdmin.Backend.DTOs;

public class ProfileDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreateTime { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class UpdateProfileRequest
{
    public string? Email { get; set; }
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}