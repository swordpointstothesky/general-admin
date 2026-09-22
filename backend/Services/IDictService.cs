using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IDictService
{
    // 树形接口
    Task<List<DictTreeNodeDto>> GetDictTreeAsync();

    // 字典类型
    Task<List<DictTypeDto>> GetDictTypesAsync();
    Task<DictTypeDto?> GetDictTypeByIdAsync(int id);
    Task<DictTypeDto> CreateDictTypeAsync(CreateDictTypeRequest request);
    Task<bool> UpdateDictTypeAsync(int id, UpdateDictTypeRequest request);
    Task<bool> DeleteDictTypeAsync(int id);

    // 字典项
    Task<List<DictItemDto>> GetItemsByTypeAsync(int dictTypeId);
    Task<List<DictItemDto>> GetItemsByTypeNameAsync(string typeName);
    Task<DictItemDto> CreateDictItemAsync(CreateDictItemRequest request);
    Task<bool> UpdateDictItemAsync(int id, UpdateDictItemRequest request);
    Task<bool> DeleteDictItemAsync(int id);
}