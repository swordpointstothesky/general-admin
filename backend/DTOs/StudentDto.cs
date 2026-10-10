using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.DTOs;

public class StudentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateOnly? EnrollDate { get; set; }
    public string? Photo { get; set; }
    public DateTime CreateTime { get; set; }
}

public class CreateStudentRequest
{
    [Required(ErrorMessage = "姓名不能为空")]
    [MaxLength(50, ErrorMessage = "姓名不能超过 50 个字符")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "性别不能为空")]
    public string Gender { get; set; } = string.Empty;

    [Range(1, 200, ErrorMessage = "年龄必须在 1-200 之间")]
    public int Age { get; set; }

    [MaxLength(50, ErrorMessage = "年级不能超过 50 个字符")]
    public string? Grade { get; set; }

    [MaxLength(50, ErrorMessage = "班级不能超过 50 个字符")]
    public string? ClassName { get; set; }

    public DateOnly? EnrollDate { get; set; }

    [MaxLength(500)]
    public string? Photo { get; set; }
    public string Crea { get; set; }
}

public class UpdateStudentRequest
{
    [MaxLength(50, ErrorMessage = "姓名不能超过 50 个字符")]
    public string? Name { get; set; }

    public string? Gender { get; set; }

    [Range(1, 200, ErrorMessage = "年龄必须在 1-200 之间")]
    public int? Age { get; set; }

    [MaxLength(50)]
    public string? Grade { get; set; }

    [MaxLength(50)]
    public string? ClassName { get; set; }

    public DateOnly? EnrollDate { get; set; }

    [MaxLength(500)]
    public string? Photo { get; set; }
}