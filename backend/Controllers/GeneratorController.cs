using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class GeneratorController : ControllerBase
{
    private readonly IGeneratorService _generatorService;

    public GeneratorController(IGeneratorService generatorService)
    {
        _generatorService = generatorService;
    }

    [HttpGet("tables")]
    public async Task<IActionResult> GetTables()
    {
        var tables = await _generatorService.GetTableNamesAsync();
        return Ok(tables);
    }

    [HttpGet("tables/{tableName}/columns")]
    public async Task<IActionResult> GetColumns(string tableName)
    {
        var table = await _generatorService.GetTableColumnsAsync(tableName);
        if (table == null) return NotFound();
        return Ok(table);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest request)
    {
        var zipBytes = await _generatorService.GenerateCodeAsync(request);
        return File(zipBytes, "application/zip", $"{request.ModuleName}_generated.zip");
    }
}