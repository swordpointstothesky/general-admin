using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IGeneratorService
{
    Task<List<string>> GetTableNamesAsync();
    Task<TableInfoDto?> GetTableColumnsAsync(string tableName);
    Task<byte[]> GenerateCodeAsync(GenerateRequest request);
}