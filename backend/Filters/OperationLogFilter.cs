using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GeneralAdmin.Backend.Models;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GeneralAdmin.Backend.Filters;

public class OperationLogFilter : IAsyncActionFilter
{
    private readonly ILogService _logService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public OperationLogFilter(ILogService logService, IHttpContextAccessor httpContextAccessor)
    {
        _logService = logService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        var request = context.HttpContext.Request;
        var user = context.HttpContext.User;

        // 获取用户信息
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var usernameClaim = user.FindFirst(ClaimTypes.Name)?.Value;

        int? userId = null;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var id))
            userId = id;

        // 获取请求体（POST/PUT 请求）
        string? requestBody = null;
        if (request.Method == "POST" || request.Method == "PUT")
        {
            request.EnableBuffering();
            var bodyStream = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            requestBody = await bodyStream.ReadToEndAsync();
            request.Body.Position = 0;
        }

        // 获取模块名（从路由或路径推断）
        var module = ExtractModule(request.Path);

        var result = await next();

        stopwatch.Stop();

        // 只记录增删改查和登录操作
        var action = ExtractAction(request.Method, result);
        if (action == null) return;

        // 获取响应状态码
        int? statusCode = null;
        if (result.Result is Microsoft.AspNetCore.Mvc.ObjectResult objectResult)
            statusCode = objectResult.StatusCode;
        else if (result.Result is Microsoft.AspNetCore.Mvc.StatusCodeResult statusCodeResult)
            statusCode = statusCodeResult.StatusCode;
        else if (result.Exception != null)
            statusCode = 500;

        // 截断响应体（避免日志过大）
        string? responseBody = null;
        if (result.Result is Microsoft.AspNetCore.Mvc.ObjectResult objResult && objResult.Value != null)
        {
            responseBody = JsonSerializer.Serialize(objResult.Value);
            if (responseBody.Length > 1000)
                responseBody = responseBody[..1000] + "... (截断)";
        }

        var log = new OperationLog
        {
            UserId = userId,
            Username = usernameClaim ?? "Unknown",
            Action = action,
            Module = module,
            Method = request.Method,
            Path = request.Path,
            QueryString = request.QueryString.ToString(),
            RequestBody = requestBody?.Length > 2000 ? requestBody[..2000] + "..." : requestBody,
            StatusCode = statusCode,
            ResponseBody = responseBody,
            ClientIP = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = request.Headers.UserAgent.ToString(),
            ExecutionTime = (int)stopwatch.ElapsedMilliseconds
        };

        await _logService.LogAsync(log);
    }

    private string ExtractModule(string path)
    {
        // 从路径中提取模块名
        var segments = path.Trim('/').Split('/');
        if (segments.Length >= 2 && segments[0] == "api")
        {
            return segments[1] switch
            {
                "users" => "用户管理",
                "roles" => "角色管理",
                "menus" => "系统管理",
                "auth" => "认证",
                _ => segments[1]
            };
        }
        return "其他";
    }

    private string? ExtractAction(string method, ActionExecutedContext context)
    {
        // 根据 HTTP 方法和状态码推断操作类型
        if (context.Exception != null) return "ERROR";

        var statusCode = 0;
        if (context.Result is Microsoft.AspNetCore.Mvc.ObjectResult objResult)
            statusCode = objResult.StatusCode ?? 0;
        else if (context.Result is Microsoft.AspNetCore.Mvc.StatusCodeResult statusResult)
            statusCode = statusResult.StatusCode;

        if (method == "POST")
        {
            // 登录特殊处理
            if (context.HttpContext.Request.Path.ToString().Contains("auth/login"))
                return "LOGIN";
            return statusCode >= 200 && statusCode < 300 ? "CREATE" : null;
        }
        if (method == "PUT") return statusCode >= 200 && statusCode < 300 ? "UPDATE" : null;
        if (method == "DELETE") return statusCode >= 200 && statusCode < 300 ? "DELETE" : null;
        if (method == "GET")
        {
            // GET 请求只记录部分关键查询
            var path = context.HttpContext.Request.Path.ToString();
            if (path.Contains("/api/users") || path.Contains("/api/roles") || path.Contains("/api/menus"))
                return "VIEW";
            return null;
        }

        return null;
    }
}