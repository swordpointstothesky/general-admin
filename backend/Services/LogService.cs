using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class LogService : ILogService
{
    private readonly AppDbContext _context;

    public LogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(OperationLog log)
    {
        _context.OperationLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<LogPageResponse> GetLogsAsync(LogQueryRequest request)
    {
        var query = _context.OperationLogs.AsQueryable();

        if (request.UserId.HasValue)
            query = query.Where(l => l.UserId == request.UserId.Value);

        if (!string.IsNullOrEmpty(request.Action))
            query = query.Where(l => l.Action == request.Action);

        if (!string.IsNullOrEmpty(request.Module))
            query = query.Where(l => l.Module == request.Module);

        if (request.StartTime.HasValue)
            query = query.Where(l => l.CreateTime >= request.StartTime.Value);

        if (request.EndTime.HasValue)
            query = query.Where(l => l.CreateTime <= request.EndTime.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.CreateTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(l => new OperationLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Action = l.Action,
                Module = l.Module,
                Method = l.Method,
                Path = l.Path,
                QueryString = l.QueryString,
                RequestBody = l.RequestBody,
                StatusCode = l.StatusCode,
                ClientIP = l.ClientIP,
                UserAgent = l.UserAgent,
                ExecutionTime = l.ExecutionTime,
                CreateTime = l.CreateTime
            })
            .ToListAsync();

        return new LogPageResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<OperationLogDto?> GetLogDetailAsync(long id)
    {
        var log = await _context.OperationLogs.FindAsync(id);
        if (log == null) return null;

        return new OperationLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            Username = log.Username,
            Action = log.Action,
            Module = log.Module,
            Method = log.Method,
            Path = log.Path,
            QueryString = log.QueryString,
            RequestBody = log.RequestBody,
            StatusCode = log.StatusCode,
            ClientIP = log.ClientIP,
            UserAgent = log.UserAgent,
            ExecutionTime = log.ExecutionTime,
            CreateTime = log.CreateTime
        };
    }

    public async Task<List<string>> GetModulesAsync()
    {
        return await _context.OperationLogs
            .Select(l => l.Module)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<string>> GetActionsAsync()
    {
        return await _context.OperationLogs
            .Select(l => l.Action)
            .Distinct()
            .ToListAsync();
    }
}