using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

/// <summary>
/// Teacher
/// </summary>
public class Teacher
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
    /// CreateTime
    /// </summary>
    public string? CreateTime { get; set; } = string.Empty;
}