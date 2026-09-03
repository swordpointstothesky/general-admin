using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required, MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty;  // 存哈希，不存明文
        [MaxLength(100)]
        public string? Email { get; set; }
        public DateTime CreateTime { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
