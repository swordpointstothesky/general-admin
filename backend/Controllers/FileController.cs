using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    // 允许的图片扩展名
    private static readonly string[] AllowedImageExtensions =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };

    // 允许的通用文件扩展名
    private static readonly string[] AllowedFileExtensions =
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".zip", ".rar"
    };

    private const long MaxImageSize = 5 * 1024 * 1024;   // 5MB
    private const long MaxFileSize = 20 * 1024 * 1024;   // 20MB

    private readonly IWebHostEnvironment _env;

    public FileController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// 上传图片
    /// </summary>
    [HttpPost("upload-image")]
    [RequestSizeLimit(MaxImageSize)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        return await UploadFileInternal(file, AllowedImageExtensions, MaxImageSize);
    }

    /// <summary>
    /// 上传通用文件
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        return await UploadFileInternal(file, AllowedFileExtensions, MaxFileSize);
    }

    /// <summary>
    /// 内部上传逻辑
    /// </summary>
    private async Task<IActionResult> UploadFileInternal(IFormFile file, string[] allowedExtensions, long maxSize)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "请选择要上传的文件" });

        if (file.Length > maxSize)
            return BadRequest(new { message = $"文件大小不能超过 {maxSize / 1024 / 1024}MB" });

        // 校验扩展名
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            return BadRequest(new { message = $"不支持的文件类型：{ext}" });

        // 生成唯一文件名（防冲突 + 防路径穿越）
        var fileName = $"{Guid.NewGuid():N}{ext}";

        // 按日期分目录：uploads/2026/09/28/xxx.jpg
        var dateFolder = DateTime.Now.ToString("yyyy/MM/dd");
        var relativePath = $"uploads/{dateFolder}/{fileName}";

        // 使用 WebRootPath（开发时是 backend/wwwroot，发布后是发布目录/wwwroot）
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", dateFolder);
        Directory.CreateDirectory(uploadDir);

        var fullPath = Path.Combine(uploadDir, fileName);

        // 保存文件
        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 返回访问 URL（前端可直接用作 <img src="...">）
        var url = $"/{relativePath}";

        return Ok(new
        {
            url,
            fileName = file.FileName,
            size = file.Length,
            contentType = file.ContentType,
        });
    }

    /// <summary>
    /// 删除文件（仅限 uploads 目录）
    /// </summary>
    [HttpDelete]
    public IActionResult Delete([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url) || !url.StartsWith("/uploads/"))
            return BadRequest(new { message = "无效的文件路径" });

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var relativePath = url.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
        var fullPath = Path.GetFullPath(Path.Combine(webRoot, relativePath));
        var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads"));

        // 防路径穿越
        if (!fullPath.StartsWith(uploadsRoot))
            return BadRequest(new { message = "无效的文件路径" });

        if (!System.IO.File.Exists(fullPath))
            return NotFound();

        System.IO.File.Delete(fullPath);
        return NoContent();
    }
}