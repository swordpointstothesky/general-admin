namespace GeneralAdmin.Backend.DTOs;

public class OperationLogDto
{
    public long Id { get; set; }
    public int? UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? QueryString { get; set; }
    public string? RequestBody { get; set; }
    public int? StatusCode { get; set; }
    public string? ClientIP { get; set; }
    public string? UserAgent { get; set; }
    public int? ExecutionTime { get; set; }
    public DateTime CreateTime { get; set; }
}

public class LogQueryRequest
{
    public int? UserId { get; set; }
    public string? Action { get; set; }
    public string? Module { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class LogPageResponse
{
    public List<OperationLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}