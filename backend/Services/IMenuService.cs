using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IMenuService
{
    Task<List<MenuDto>> GetMenusByUserAsync(int userId);
}