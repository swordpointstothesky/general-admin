using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IRoleService
{
    Task<List<RoleDto>> GetRolesAsync();
    Task<RoleDto?> GetRoleByIdAsync(int id);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request);
    Task<bool> UpdateRoleAsync(int id, UpdateRoleRequest request);
    Task<bool> DeleteRoleAsync(int id);
    Task<List<PermissionDto>> GetAllPermissionsAsync();
}