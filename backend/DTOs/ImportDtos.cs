namespace GeneralAdmin.Backend.DTOs;

public class ImportResult
{
    /// <summary>成功条数</summary>
    public int SuccessCount { get; set; }

    /// <summary>失败条数</summary>
    public int FailedCount { get; set; }

    /// <summary>错误详情（行号 + 错误信息）</summary>
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    /// <summary>行号（Excel 中的行号）</summary>
    public int Row { get; set; }

    /// <summary>错误信息</summary>
    public string Message { get; set; } = string.Empty;
}