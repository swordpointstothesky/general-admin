using Dapper;
using GeneralAdmin.Backend.DTOs;
using Npgsql;
using Scriban;
using Scriban.Runtime;
using System.Data;
using System.IO.Compression;
using System.Text;

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

    // ========== 获取所有表名 ==========
    public async Task<List<string>> GetTableNamesAsync()
    {
        using var conn = CreateConnection();
        var sql = @"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND table_name NOT LIKE '__EF%'
            ORDER BY table_name";
        var tables = await conn.QueryAsync<string>(sql);
        return tables.ToList();
    }

    // ========== 获取表结构 ==========
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

        // ✅ 使用强类型 RawColumnInfo，而不是 dynamic
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
                TsType = MapToTsType(c.DataType)
            }).ToList()
        };
    }

    // ========== 生成代码并打包 ZIP ==========
    public async Task<byte[]> GenerateCodeAsync(GenerateRequest request)
    {
        var files = new Dictionary<string, string>();

        // 渲染各个模板
        files[$"{request.ModuleName}.cs"] = await RenderTemplate("Entity", request);
        files[$"{request.ModuleName}Dto.cs"] = await RenderTemplate("Dto", request);
        files[$"I{request.ModuleName}Service.cs"] = await RenderTemplate("IService", request);
        files[$"{request.ModuleName}Service.cs"] = await RenderTemplate("Service", request);
        files[$"{request.ModuleName}Controller.cs"] = await RenderTemplate("Controller", request);
        files[$"{request.ModuleName}s.tsx"] = await RenderTemplate("ReactList", request);

        // 打包 ZIP
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            foreach (var (fileName, content) in files)
            {
                var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
                await writer.WriteAsync(content);
            }
        }

        return ms.ToArray();
    }

    // ========== 模板渲染 ==========
    private async Task<string> RenderTemplate(string templateName, GenerateRequest request)
    {
        var templatePath = Path.Combine(AppContext.BaseDirectory, "Templates", $"{templateName}.scriban");
        var templateText = await File.ReadAllTextAsync(templatePath);
        var template = Template.Parse(templateText);

        var pk = request.Columns.First(c => c.IsPrimaryKey);
        var camelName = char.ToLower(request.ModuleName[0]) + request.ModuleName.Substring(1);
        var pkCamelName = char.ToLower(pk.ColumnName[0]) + pk.ColumnName.Substring(1);

        // 构造 Columns 的 ScriptObject 列表
        var columnsList = new ScriptArray();
        foreach (var col in request.Columns)
        {
            columnsList.Add(ToColumnScriptObject(col));
        }

        var listColumns = new ScriptArray();
        foreach (var col in request.Columns.Where(c => c.ShowInList))
        {
            listColumns.Add(ToColumnScriptObject(col));
        }

        var formColumns = new ScriptArray();
        foreach (var col in request.Columns.Where(c => c.ShowInForm && !c.IsPrimaryKey))
        {
            formColumns.Add(ToColumnScriptObject(col));
        }

        // ✅ 用 ScriptObject 显式传参
        var scriptObject = new ScriptObject();
        scriptObject["TableName"] = request.TableName;
        scriptObject["ModuleName"] = request.ModuleName;
        scriptObject["CamelName"] = camelName;
        scriptObject["DisplayName"] = request.DisplayName;
        scriptObject["PkName"] = pk.ColumnName;
        scriptObject["PkType"] = pk.CSharpType;
        scriptObject["PkCamelName"] = pkCamelName;
        scriptObject["Columns"] = columnsList;
        scriptObject["ListColumns"] = listColumns;
        scriptObject["FormColumns"] = formColumns;

        var context = new TemplateContext();
        context.PushGlobal(scriptObject);

        return await template.RenderAsync(context);
    }

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
        };
    }

    // ========== 类型映射 ==========
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

        // 值类型加 ? 表示可空
        if (isNullable && type != "string" && type != "byte[]")
            return type + "?";
        if (type == "string")
            return "string?";
        return type;
    }

    private string MapToTsType(string dbType)
    {
        return dbType.ToLower() switch
        {
            "integer" or "int4" or "bigint" or "int8" or "smallint" or "int2" => "number",
            "numeric" or "decimal" or "real" or "float4" or "double precision" or "float8" => "number",
            "boolean" or "bool" => "boolean",
            "timestamp with time zone" or "timestamp" or "timestamptz" or "date" or "time" => "string",
            _ => "string"
        };
    }
}

public class RawColumnInfo
{
    public string ColumnName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string IsNullable { get; set; } = string.Empty;
    public int? MaxLength { get; set; }
    public bool IsPrimaryKey { get; set; }
}