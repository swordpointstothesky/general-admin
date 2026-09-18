using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;

namespace GeneralAdmin.Backend.Services;

public interface ILogService
{
    Task LogAsync(OperationLog log);
    Task<LogPageResponse> GetLogsAsync(LogQueryRequest request);
    Task<OperationLogDto?> GetLogDetailAsync(long id);
    Task<List<string>> GetModulesAsync();
    Task<List<string>> GetActionsAsync();
}