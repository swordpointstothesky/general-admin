using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class MenuService : IMenuService
{
    private readonly AppDbContext _context;

    public MenuService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<MenuDto>> GetMenusByUserAsync(int userId)
    {
        // 1. 获取用户的所有角色 ID
        var roleIds = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();

        // 2. 根据角色 ID 获取关联的菜单 ID
        var menuIds = await _context.RoleMenus
            .Where(rm => roleIds.Contains(rm.RoleId))
            .Select(rm => rm.MenuId)
            .Distinct()
            .ToListAsync();

        // 3. 获取所有有权限的菜单（并构建树）
        var menus = await _context.Menus
            .Where(m => menuIds.Contains(m.Id) && m.IsActive)
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        // 4. 构建菜单树
        return BuildMenuTree(menus, null);
    }

    private List<MenuDto> BuildMenuTree(List<Menu> menus, int? parentId)
    {
        return menus
            .Where(m => m.ParentId == parentId)
            .Select(m => new MenuDto
            {
                Id = m.Id,
                ParentId = m.ParentId,
                Name = m.Name,
                Path = m.Path,
                Icon = m.Icon,
                SortOrder = m.SortOrder,
                Children = BuildMenuTree(menus, m.Id)
            })
            .ToList();
    }

    public async Task<List<MenuDto>> GetAllMenusAsync()
    {
        var menus = await _context.Menus
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        return BuildMenuTree(menus, null);
    }

    public async Task<List<int>> GetRoleMenuIdsAsync(int roleId)
    {
        return await _context.RoleMenus
            .Where(rm => rm.RoleId == roleId)
            .Select(rm => rm.MenuId)
            .ToListAsync();
    }

    public async Task<bool> AssignMenusToRoleAsync(int roleId, List<int> menuIds)
    {
        var role = await _context.Roles.FindAsync(roleId);
        if (role == null) return false;

        // 删除旧关联
        var oldMenus = await _context.RoleMenus
            .Where(rm => rm.RoleId == roleId)
            .ToListAsync();
        _context.RoleMenus.RemoveRange(oldMenus);

        // 添加新关联
        foreach (var menuId in menuIds)
        {
            _context.RoleMenus.Add(new RoleMenu
            {
                RoleId = roleId,
                MenuId = menuId
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }
}