namespace GeneralAdmin.Backend.DTOs;

public class TableInfoDto
{
    public string TableName { get; set; } = string.Empty;
    public string? TableComment { get; set; }
    public List<ColumnInfoDto> Columns { get; set; } = new();
}

public class ColumnInfoDto
{
    public string ColumnName { get; set; } = string.Empty;
    public string CamelName { get; set; } = string.Empty;  // ✅ 必须有
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public int? MaxLength { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public bool ShowInList { get; set; } = true;
    public bool ShowInForm { get; set; } = true;
    public string CSharpType { get; set; } = string.Empty;
    public string TsType { get; set; } = string.Empty;
}

public class GenerateRequest
{
    public string TableName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;     // 模块名（如 Product）
    public string DisplayName { get; set; } = string.Empty;    // 中文名（如 商品）
    public List<ColumnInfoDto> Columns { get; set; } = new();
}