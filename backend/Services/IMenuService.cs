using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IMenuService
{
    Task<List<MenuDto>> GetMenusByUserAsync(int userId);
    Task<List<MenuDto>> GetAllMenusAsync();
    Task<List<int>> GetRoleMenuIdsAsync(int roleId);
    Task<bool> AssignMenusToRoleAsync(int roleId, List<int> menuIds);
}