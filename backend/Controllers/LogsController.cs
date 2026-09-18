using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly ILogService _logService;

    public LogsController(ILogService logService)
    {
        _logService = logService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] LogQueryRequest request)
    {
        var result = await _logService.GetLogsAsync(request);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLogDetail(long id)
    {
        var log = await _logService.GetLogDetailAsync(id);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpGet("modules")]
    public async Task<IActionResult> GetModules()
    {
        var modules = await _logService.GetModulesAsync();
        return Ok(modules);
    }

    [HttpGet("actions")]
    public async Task<IActionResult> GetActions()
    {
        var actions = await _logService.GetActionsAsync();
        return Ok(actions);
    }
}