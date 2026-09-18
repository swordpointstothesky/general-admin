using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models;

public class OperationLog
{
    public long Id { get; set; }
    public int? UserId { get; set; }  // 改为可空
    public User? User { get; set; }   // 导航属性也改为可空

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty;    // CREATE/UPDATE/DELETE/LOGIN/LOGOUT/VIEW

    [Required, MaxLength(50)]
    public string Module { get; set; } = string.Empty;     // 用户管理/角色管理/系统管理

    [Required, MaxLength(10)]
    public string Method { get; set; } = string.Empty;     // GET/POST/PUT/DELETE

    [Required, MaxLength(255)]
    public string Path { get; set; } = string.Empty;

    public string? QueryString { get; set; }
    public string? RequestBody { get; set; }
    public int? StatusCode { get; set; }
    public string? ResponseBody { get; set; }

    [MaxLength(45)]
    public string? ClientIP { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    public int? ExecutionTime { get; set; }                // 毫秒

    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
}