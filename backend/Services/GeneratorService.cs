using System.Data;
using System.IO.Compression;
using System.Text;
using Dapper;
using GeneralAdmin.Backend.DTOs;
using Npgsql;
using Scriban;
using Scriban.Runtime;

namespace GeneralAdmin.Backend.Services;

public class GeneratorService : IGeneratorService
{
    private readonly IConfiguration _configuration;

    public GeneratorService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private IDbConnection CreateConnection()
    {
        var connStr = _configuration.GetConnectionString("DefaultConnection");
        return new NpgsqlConnection(connStr);
    }

    // ================================================================
    //  1. 获取所有表名
    // ================================================================
    public async Task<List<string>> GetTableNamesAsync()
    {
        using var conn = CreateConnection();
        const string sql = @"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND table_name NOT LIKE '__EF%'
            ORDER BY table_name";

        var tables = await conn.QueryAsync<string>(sql);
        return tables.ToList();
    }

    // ================================================================
    //  2. 获取表结构
    // ================================================================
    public async Task<TableInfoDto?> GetTableColumnsAsync(string tableName)
    {
        using var conn = CreateConnection();

        // 检查表是否存在
        var exists = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = @TableName",
            new { TableName = tableName });

        if (exists == 0) return null;

        const string sql = @"
            SELECT 
                c.column_name AS ColumnName,
                c.data_type AS DataType,
                c.is_nullable AS IsNullable,
                c.character_maximum_length AS MaxLength,
                CASE WHEN pk.column_name IS NOT NULL THEN TRUE ELSE FALSE END AS IsPrimaryKey
            FROM information_schema.columns c
            LEFT JOIN (
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_schema = 'public'
                  AND tc.table_name = @TableName
                  AND tc.constraint_type = 'PRIMARY KEY'
            ) pk ON c.column_name = pk.column_name
            WHERE c.table_schema = 'public' AND c.table_name = @TableName
            ORDER BY c.ordinal_position";

        var rawColumns = (await conn.QueryAsync<RawColumnInfo>(sql, new { TableName = tableName })).ToList();

        return new TableInfoDto
        {
            TableName = tableName,
            Columns = rawColumns.Select(c => new ColumnInfoDto
            {
                ColumnName = c.ColumnName,
                CamelName = string.IsNullOrEmpty(c.ColumnName)
                    ? string.Empty
                    : char.ToLower(c.ColumnName[0]) + c.ColumnName.Substring(1),
                DataType = c.DataType,
                IsNullable = c.IsNullable == "YES",
                IsPrimaryKey = c.IsPrimaryKey,
                MaxLength = c.MaxLength,
                DisplayName = c.ColumnName,
                ShowInList = true,
                ShowInForm = true,
                CSharpType = MapToCSharpType(c.DataType, c.IsNullable == "YES"),
                TsType = MapToTsType(c.DataType),
                DictType = null,  // 默认无字典绑定，用户在前端配置
                InputType = GuessInputType(c.DataType, c.ColumnName),
            }).ToList()
        };
    }

    private string GuessInputType(string dbType, string columnName)
    {
        // 布尔 → switch
        if (dbType.Equals("boolean", StringComparison.OrdinalIgnoreCase) ||
            dbType.Equals("bool", StringComparison.OrdinalIgnoreCase))
            return "switch";

        // 日期/时间 → date
        if (dbType.Contains("timestamp") || dbType == "date" || dbType == "time")
            return "date";

        // 数字 → number
        if (dbType.Contains("int") || dbType.Contains("numeric") ||
            dbType.Contains("decimal") || dbType.Contains("float") || dbType.Contains("real"))
            return "number";

        // 名字里带 image/photo/avatar/pic → image
        var lower = columnName.ToLower();
        if (lower.Contains("image") || lower.Contains("photo") ||
            lower.Contains("avatar") || lower.Contains("pic") || lower.Contains("icon"))
            return "image";

        // 文本 → textarea（如果长度 > 500 或叫 description/remark/content）
        if (lower.Contains("desc") || lower.Contains("remark") ||
            lower.Contains("content") || lower.Contains("note"))
            return "textarea";

        return "text";
    }

    // ================================================================
    //  3. 生成代码并打包 ZIP
    // ================================================================
    public async Task<byte[]> GenerateCodeAsync(GenerateRequest request)
    {
        var files = new Dictionary<string, string>();

        files[$"{request.ModuleName}.cs"] = await RenderTemplate("Entity", request);
        files[$"{request.ModuleName}Dto.cs"] = await RenderTemplate("Dto", request);
        files[$"I{request.ModuleName}Service.cs"] = await RenderTemplate("IService", request);
        files[$"{request.ModuleName}Service.cs"] = await RenderTemplate("Service", request);
        files[$"{request.ModuleName}Controller.cs"] = await RenderTemplate("Controller", request);
        files[$"{request.ModuleName}s.tsx"] = await RenderTemplate("ReactList", request);

        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            foreach (var (fileName, content) in files)
            {
                var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                await using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
                await writer.WriteAsync(content);
            }
        }

        return ms.ToArray();
    }

    // ================================================================
    //  4. 模板渲染
    // ================================================================
    private async Task<string> RenderTemplate(string templateName, GenerateRequest request)
    {
        var templatePath = Path.Combine(AppContext.BaseDirectory, "Templates", $"{templateName}.scriban");
        var templateText = await File.ReadAllTextAsync(templatePath);
        var template = Template.Parse(templateText);

        // ---------- 主键 ----------
        var pk = request.Columns.First(c => c.IsPrimaryKey);
        var camelName = char.ToLower(request.ModuleName[0]) + request.ModuleName.Substring(1);
        var pkCamelName = char.ToLower(pk.ColumnName[0]) + pk.ColumnName.Substring(1);

        // ---------- 排除的自动字段（不显示在表单中） ----------
        var excludeFromForm = new[] { "CreateTime", "UpdateTime", "CreatedAt", "UpdatedAt" };

        // ---------- 构造 Columns ----------
        var columnsList = new ScriptArray();
        foreach (var col in request.Columns)
        {
            columnsList.Add(ToColumnScriptObject(col));
        }

        // ---------- 列表列（ShowInList） ----------
        var listColumns = new ScriptArray();
        foreach (var col in request.Columns.Where(c => c.ShowInList))
        {
            listColumns.Add(ToColumnScriptObject(col));
        }

        // ---------- 表单列（ShowInForm 且非主键 且非自动字段） ----------
        var formColumns = new ScriptArray();
        foreach (var col in request.Columns.Where(c =>
            c.ShowInForm && !c.IsPrimaryKey && !excludeFromForm.Contains(c.ColumnName)))
        {
            formColumns.Add(ToColumnScriptObject(col));
        }

        // ---------- ✅ 字典列（有字典绑定的字段） ----------
        var dictColumns = new ScriptArray();
        foreach (var col in request.Columns.Where(c => !string.IsNullOrEmpty(c.DictType)))
        {
            dictColumns.Add(ToColumnScriptObject(col));
        }

        // ---------- 默认可见列（用于列设置初始化） ----------
        var defaultVisible = string.Join(", ", request.Columns
            .Where(c => c.ShowInList)
            .Select(c => $"'{c.CamelName}'"));

        // ---------- 构造 ScriptObject ----------
        var scriptObject = new ScriptObject();
        scriptObject["TableName"] = request.TableName;
        scriptObject["ModuleName"] = request.ModuleName;
        scriptObject["CamelName"] = camelName;
        scriptObject["DisplayName"] = request.DisplayName;
        scriptObject["PkName"] = pk.ColumnName;
        scriptObject["PkType"] = pk.CSharpType;
        scriptObject["PkCamelName"] = pkCamelName;
        scriptObject["DefaultVisible"] = defaultVisible;
        scriptObject["Columns"] = columnsList;
        scriptObject["ListColumns"] = listColumns;
        scriptObject["FormColumns"] = formColumns;
        scriptObject["DictColumns"] = dictColumns;   // ✅ 新增

        var context = new TemplateContext();
        context.PushGlobal(scriptObject);

        return await template.RenderAsync(context);
    }

    // ================================================================
    //  5. 列对象转换
    // ================================================================
    private ScriptObject ToColumnScriptObject(ColumnInfoDto col)
    {
        return new ScriptObject
        {
            ["ColumnName"] = col.ColumnName,
            ["CamelName"] = col.CamelName,
            ["DataType"] = col.DataType,
            ["CSharpType"] = col.CSharpType,
            ["TsType"] = col.TsType,
            ["DisplayName"] = col.DisplayName,
            ["IsPrimaryKey"] = col.IsPrimaryKey,
            ["IsNullable"] = col.IsNullable,
            ["ShowInList"] = col.ShowInList,
            ["ShowInForm"] = col.ShowInForm,
            ["DictType"] = col.DictType,        // ✅ 新增
            ["IsDictField"] = col.IsDictField,  // ✅ 新增
            ["InputType"] = col.InputType,
        };
    }

    // ================================================================
    //  6. 类型映射：PostgreSQL → C#
    // ================================================================
    private string MapToCSharpType(string dbType, bool isNullable)
    {
        var type = dbType.ToLower() switch
        {
            "integer" or "int4" => "int",
            "bigint" or "int8" => "long",
            "smallint" or "int2" => "short",
            "numeric" or "decimal" => "decimal",
            "real" or "float4" => "float",
            "double precision" or "float8" => "double",
            "boolean" or "bool" => "bool",
            "timestamp with time zone" or "timestamp" or "timestamptz" => "DateTime",
            "date" => "DateOnly",
            "time" => "TimeOnly",
            "uuid" => "Guid",
            "text" or "character varying" or "varchar" => "string",
            "json" or "jsonb" => "string",
            _ => "string"
        };

        if (type == "string")
            return "string?";

        if (isNullable)
            return type + "?";

        return type;
    }

    // ================================================================
    //  7. 类型映射：PostgreSQL → TypeScript
    // ================================================================
    private string MapToTsType(string dbType)
    {
        return dbType.ToLower() switch
        {
            "integer" or "int4" or "bigint" or "int8" or "smallint" or "int2" => "number",
            "numeric" or "decimal" or "real" or "float4" or "double precision" or "float8" => "number",
            "boolean" or "bool" => "boolean",
            _ => "string"
        };
    }
}

// ================================================================
//  Dapper 映射类（强类型，替代 dynamic）
// ================================================================
public class RawColumnInfo
{
    public string ColumnName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string IsNullable { get; set; } = string.Empty;
    public int? MaxLength { get; set; }
    public bool IsPrimaryKey { get; set; }
}