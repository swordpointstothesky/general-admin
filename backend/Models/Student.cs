using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

/// <summary>
/// Student
/// </summary>
public class Student
{
    /// <summary>
    /// Id
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Name
    /// </summary>
    public string? Name { get; set; } = string.Empty;
    /// <summary>
    /// Gender
    /// </summary>
    public string? Gender { get; set; } = string.Empty;
    /// <summary>
    /// Age
    /// </summary>
    public int Age { get; set; }
    /// <summary>
    /// Grade
    /// </summary>
    public string? Grade { get; set; } = string.Empty;
    /// <summary>
    /// ClassName
    /// </summary>
    public string? ClassName { get; set; } = string.Empty;
    /// <summary>
    /// CreateTime
    /// </summary>
    public string? CreateTime { get; set; } = string.Empty;
}