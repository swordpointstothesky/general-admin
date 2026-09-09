using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class RoleService : IRoleService
{
    private readonly AppDbContext _context;

    public RoleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        return await _context.Roles
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                CreateTime = r.CreateTime,
                IsActive = r.IsActive,
                Permissions = r.RolePermissions
                    .Select(rp => new PermissionDto
                    {
                        Id = rp.Permission.Id,
                        Name = rp.Permission.Name,
                        DisplayName = rp.Permission.DisplayName,
                        Category = rp.Permission.Category
                    })
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<RoleDto?> GetRoleByIdAsync(int id)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return null;

        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreateTime = role.CreateTime,
            IsActive = role.IsActive,
            Permissions = role.RolePermissions
                .Select(rp => new PermissionDto
                {
                    Id = rp.Permission.Id,
                    Name = rp.Permission.Name,
                    DisplayName = rp.Permission.DisplayName,
                    Category = rp.Permission.Category
                })
                .ToList()
        };
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        if (await _context.Roles.AnyAsync(r => r.Name == request.Name))
            throw new InvalidOperationException("角色名称已存在");

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        // 关联权限
        if (request.PermissionIds.Any())
        {
            var permissions = await _context.Permissions
                .Where(p => request.PermissionIds.Contains(p.Id))
                .ToListAsync();

            foreach (var perm in permissions)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = perm.Id
                });
            }
            await _context.SaveChangesAsync();
        }

        return await GetRoleByIdAsync(role.Id) ?? throw new InvalidOperationException("创建角色失败");
    }

    public async Task<bool> UpdateRoleAsync(int id, UpdateRoleRequest request)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return false;

        if (!string.IsNullOrEmpty(request.Name))
            role.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            role.Description = request.Description;

        if (request.IsActive.HasValue)
            role.IsActive = request.IsActive.Value;

        // 更新权限（先删后加）
        if (request.PermissionIds != null)
        {
            // 删除旧权限
            _context.RolePermissions.RemoveRange(role.RolePermissions);

            // 添加新权限
            foreach (var permId in request.PermissionIds)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permId
                });
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        var role = await _context.Roles.FindAsync(id);
        if (role == null) return false;

        // 如果有用户关联，阻止删除
        if (await _context.UserRoles.AnyAsync(ur => ur.RoleId == id))
            throw new InvalidOperationException("该角色已被用户使用，无法删除");

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<PermissionDto>> GetAllPermissionsAsync()
    {
        return await _context.Permissions
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                DisplayName = p.DisplayName,
                Category = p.Category
            })
            .ToListAsync();
    }
}