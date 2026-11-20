using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IMenuService
{
    Task<List<MenuDto>> GetMenuTreeAsync(string? keyword, string? type, bool? isActive);
    Task<MenuDto?> GetMenuByIdAsync(int id);
    Task<MenuDto> CreateMenuAsync(CreateMenuRequest request);
    Task<bool> UpdateMenuAsync(int id, UpdateMenuRequest request);
    Task<bool> DeleteMenuAsync(int id);
    Task<UserMenuResponse> GetUserMenusAsync(int userId);
    Task<List<int>> GetRoleMenuIdsAsync(int roleId);
    Task<bool> AssignMenusToRoleAsync(int roleId, List<int> menuIds);
}