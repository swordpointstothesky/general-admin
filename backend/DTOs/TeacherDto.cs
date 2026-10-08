namespace GeneralAdmin.Backend.DTOs;

public class TeacherDto
{
    public int Id { get; set; }
    public string? Name { get; set; } = string.Empty;
    public string? Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? CreateTime { get; set; } = string.Empty;
    public string? Photo { get; set; } = string.Empty;
}

public class CreateTeacherRequest
{
    public string? Name { get; set; } = string.Empty;
    public string? Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? Photo { get; set; } = string.Empty;
}

public class UpdateTeacherRequest
{
    public string? Name { get; set; }
    public string? Gender { get; set; }
    public int? Age { get; set; }
    public string? Photo { get; set; }
}