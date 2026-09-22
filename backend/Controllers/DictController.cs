using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeneralAdmin.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DictController : ControllerBase
{
    private readonly IDictService _dictService;

    public DictController(IDictService dictService)
    {
        _dictService = dictService;
    }

    // ========== 树形接口 ==========
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        return Ok(await _dictService.GetDictTreeAsync());
    }

    // ========== 字典类型 ==========
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes()
    {
        return Ok(await _dictService.GetDictTypesAsync());
    }

    [HttpGet("types/{id}")]
    public async Task<IActionResult> GetType(int id)
    {
        var type = await _dictService.GetDictTypeByIdAsync(id);
        if (type == null) return NotFound();
        return Ok(type);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] CreateDictTypeRequest request)
    {
        try
        {
            return Ok(await _dictService.CreateDictTypeAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("types/{id}")]
    public async Task<IActionResult> UpdateType(int id, [FromBody] UpdateDictTypeRequest request)
    {
        var result = await _dictService.UpdateDictTypeAsync(id, request);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("types/{id}")]
    public async Task<IActionResult> DeleteType(int id)
    {
        var result = await _dictService.DeleteDictTypeAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // ========== 字典项 ==========
    [HttpGet("types/{dictTypeId}/items")]
    public async Task<IActionResult> GetItems(int dictTypeId)
    {
        return Ok(await _dictService.GetItemsByTypeAsync(dictTypeId));
    }

    [HttpGet("items/by-name/{typeName}")]
    public async Task<IActionResult> GetItemsByName(string typeName)
    {
        return Ok(await _dictService.GetItemsByTypeNameAsync(typeName));
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] CreateDictItemRequest request)
    {
        try
        {
            return Ok(await _dictService.CreateDictItemAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("items/{id}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateDictItemRequest request)
    {
        var result = await _dictService.UpdateDictItemAsync(id, request);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("items/{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var result = await _dictService.DeleteDictItemAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}