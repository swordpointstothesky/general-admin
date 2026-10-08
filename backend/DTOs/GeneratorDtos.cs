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
    public string? DictType { get; set; }   // 绑定的字典编码，null 表示不是字典字段
    public bool IsDictField => !string.IsNullOrEmpty(DictType);
    public string InputType { get; set; } = "text";
}

public class GenerateRequest
{
    public string TableName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;     // 模块名（如 Product）
    public string DisplayName { get; set; } = string.Empty;    // 中文名（如 商品）
    public List<ColumnInfoDto> Columns { get; set; } = new();
}