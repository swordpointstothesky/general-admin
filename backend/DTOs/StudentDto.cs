namespace GeneralAdmin.Backend.DTOs;

public class StudentDto
{
    public int Id { get; set; }
    public string? Name { get; set; } = string.Empty;
    public string? Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? Grade { get; set; } = string.Empty;
    public string? ClassName { get; set; } = string.Empty;
    public string? CreateTime { get; set; } = string.Empty;
}

public class CreateStudentRequest
{
    public string? Name { get; set; } = string.Empty;
    public string? Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? Grade { get; set; } = string.Empty;
    public string? ClassName { get; set; } = string.Empty;
    public string? CreateTime { get; set; } = string.Empty;
}

public class UpdateStudentRequest
{
    public string? Name { get; set; }
    public string? Gender { get; set; }
    public int? Age { get; set; }
    public string? Grade { get; set; }
    public string? ClassName { get; set; }
    public string? CreateTime { get; set; }
}