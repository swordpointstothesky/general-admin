using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class MenuService : IMenuService
{
    private readonly AppDbContext _context;
    private const string AdminRoleName = "Admin";   // 按项目实际改

    public MenuService(AppDbContext context) => _context = context;

    // ============ 管理端：整棵树 ============
    public async Task<List<MenuDto>> GetMenuTreeAsync(string? keyword, string? type, bool? isActive)
    {
        var query = _context.Menus.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(m => m.Type == type);
        if (isActive is bool a)
            query = query.Where(m => m.IsActive == a);

        var all = await query.OrderBy(m => m.SortOrder).ThenBy(m => m.Id).ToListAsync();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            var hitIds = all.Where(m =>
                    (m.Name ?? "").ToLower().Contains(kw) ||
                    (m.Path ?? "").ToLower().Contains(kw) ||
                    (m.Permission ?? "").ToLower().Contains(kw))
                .Select(m => m.Id).ToHashSet();

            // 保留命中节点的祖先，避免树断
            var keep = new HashSet<int>();
            var byId = all.ToDictionary(m => m.Id);
            foreach (var id in hitIds)
            {
                var cur = byId.GetValueOrDefault(id);
                while (cur != null && keep.Add(cur.Id))
                    cur = cur.ParentId is int pid ? byId.GetValueOrDefault(pid) : null;
            }
            all = all.Where(m => keep.Contains(m.Id)).ToList();
        }

        return BuildTree(all, null);
    }

    private static List<MenuDto> BuildTree(List<Menu> all, int? parentId) =>
        all.Where(m => m.ParentId == parentId)
           .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
           .Select(m => new MenuDto
           {
               Id = m.Id,
               ParentId = m.ParentId,
               Name = m.Name,
               Type = m.Type,
               Path = m.Path,
               Component = m.Component,
               Icon = m.Icon,
               Permission = m.Permission,
               SortOrder = m.SortOrder,
               Visible = m.Visible,
               IsActive = m.IsActive,
               CreateTime = m.CreateTime,
               Children = BuildTree(all, m.Id)
           })
           .ToList();

    public async Task<MenuDto?> GetMenuByIdAsync(int id)
    {
        var m = await _context.Menus.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return m == null ? null : Map(m);
    }

    private static MenuDto Map(Menu m) => new()
    {
        Id = m.Id,
        ParentId = m.ParentId,
        Name = m.Name,
        Type = m.Type,
        Path = m.Path,
        Component = m.Component,
        Icon = m.Icon,
        Permission = m.Permission,
        SortOrder = m.SortOrder,
        Visible = m.Visible,
        IsActive = m.IsActive,
        CreateTime = m.CreateTime
    };

    // ============ 新增 ============
    public async Task<MenuDto> CreateMenuAsync(CreateMenuRequest req)
    {
        ValidateByType(req);

        if (req.ParentId is int pid && !await _context.Menus.AnyAsync(m => m.Id == pid))
            throw new InvalidOperationException("父级菜单不存在");

        if (await _context.Menus.AnyAsync(m => m.ParentId == req.ParentId && m.Name == req.Name))
            throw new InvalidOperationException("同级下已存在同名菜单");

        if (!string.IsNullOrWhiteSpace(req.Path) &&
            await _context.Menus.AnyAsync(m => m.Path == req.Path))
            throw new InvalidOperationException("路由路径已被占用");

        var m = new Menu
        {
            ParentId = req.ParentId,
            Name = req.Name,
            Type = req.Type,
            Path = req.Path ?? string.Empty,
            Component = req.Component,
            Icon = req.Icon,
            Permission = req.Permission,
            SortOrder = req.SortOrder,
            Visible = req.Visible,
            IsActive = req.IsActive,
            CreateTime = DateTime.UtcNow
        };
        _context.Menus.Add(m);
        await _context.SaveChangesAsync();
        return Map(m);
    }

    // ============ 修改 ============
    public async Task<bool> UpdateMenuAsync(int id, UpdateMenuRequest req)
    {
        ValidateByType(req);

        var m = await _context.Menus.FindAsync(id);
        if (m == null) return false;

        if (req.ParentId == id)
            throw new InvalidOperationException("父级不能是自己");

        if (req.ParentId is int newPid && await IsDescendantAsync(id, newPid))
            throw new InvalidOperationException("父级不能是当前菜单的子级");

        if (req.ParentId is int pid2 && !await _context.Menus.AnyAsync(x => x.Id == pid2))
            throw new InvalidOperationException("父级菜单不存在");

        if (await _context.Menus.AnyAsync(x => x.Id != id && x.ParentId == req.ParentId && x.Name == req.Name))
            throw new InvalidOperationException("同级下已存在同名菜单");

        if (!string.IsNullOrWhiteSpace(req.Path) &&
            await _context.Menus.AnyAsync(x => x.Id != id && x.Path == req.Path))
            throw new InvalidOperationException("路由路径已被占用");

        m.ParentId = req.ParentId;
        m.Name = req.Name;
        m.Type = req.Type;
        m.Path = req.Path ?? string.Empty;
        m.Component = req.Component;
        m.Icon = req.Icon;
        m.Permission = req.Permission;
        m.SortOrder = req.SortOrder;
        m.Visible = req.Visible;
        m.IsActive = req.IsActive;

        await _context.SaveChangesAsync();
        return true;
    }

    private static void ValidateByType(CreateMenuRequest req)
    {
        switch (req.Type)
        {
            case "directory":
                // 目录：不强制 path / component
                break;
            case "menu":
                if (string.IsNullOrWhiteSpace(req.Path))
                    throw new InvalidOperationException("菜单类型必须填写路由路径");
                if (string.IsNullOrWhiteSpace(req.Component))
                    throw new InvalidOperationException("菜单类型必须填写组件路径");
                break;
            case "button":
                if (string.IsNullOrWhiteSpace(req.Permission))
                    throw new InvalidOperationException("按钮类型必须填写权限标识");
                break;
            default:
                throw new InvalidOperationException("非法的菜单类型");
        }
    }

    private async Task<bool> IsDescendantAsync(int ancestorId, int candidateId)
    {
        var all = await _context.Menus.AsNoTracking()
            .Select(x => new { x.Id, x.ParentId }).ToListAsync();
        var byId = all.ToDictionary(x => x.Id);

        var cur = byId.GetValueOrDefault(candidateId);
        while (cur != null)
        {
            if (cur.ParentId == ancestorId) return true;
            cur = cur.ParentId is int p ? byId.GetValueOrDefault(p) : null;
        }
        return false;
    }

    // ============ 删除（级联删子级） ============
    public async Task<bool> DeleteMenuAsync(int id)
    {
        var m = await _context.Menus.FindAsync(id);
        if (m == null) return false;
        _context.Menus.Remove(m);
        await _context.SaveChangesAsync();
        return true;
    }

    // ============ 当前用户菜单 ============
    public async Task<UserMenuResponse> GetUserMenusAsync(int userId)
    {
        var isAdmin = await _context.UserRoles
            .AnyAsync(ur => ur.UserId == userId && ur.Role.Name == AdminRoleName);

        List<Menu> allMenus;

        if (isAdmin)
        {
            allMenus = await _context.Menus.AsNoTracking()
                .Where(m => m.IsActive)
                .OrderBy(m => m.SortOrder).ThenBy(m => m.Id).ToListAsync();
        }
        else
        {
            var grantedIds = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .SelectMany(ur => ur.Role.RoleMenus)
                .Select(rm => rm.MenuId).Distinct().ToListAsync();

            var granted = await _context.Menus.AsNoTracking()
                .Where(m => m.IsActive && grantedIds.Contains(m.Id))
                .ToListAsync();

            // 只授权了子菜单未授权父级时，把父级链路补齐，否则侧边栏断链
            var allById = await _context.Menus.AsNoTracking().ToDictionaryAsync(x => x.Id);
            var need = new HashSet<int>(granted.Select(m => m.Id));
            foreach (var m in granted)
            {
                var cur = m;
                while (cur.ParentId is int p && allById.TryGetValue(p, out var parent) && need.Add(p))
                    cur = parent;
            }
            allMenus = need.Select(i => allById[i])
                .OrderBy(m => m.SortOrder).ThenBy(m => m.Id).ToList();
        }

        var permissions = allMenus
            .Where(m => !string.IsNullOrWhiteSpace(m.Permission))
            .Select(m => m.Permission!)
            .Distinct().ToList();

        return new UserMenuResponse
        {
            Menus = BuildTree(allMenus, null),
            Permissions = permissions,
            IsAdmin = isAdmin
        };
    }

    // ============ ✅ 新增：获取角色拥有的菜单ID集合 ============
    public async Task<List<int>> GetRoleMenuIdsAsync(int roleId)
    {
        return await _context.RoleMenus
            .Where(rm => rm.RoleId == roleId)
            .Select(rm => rm.MenuId)
            .ToListAsync();
    }

    // ============ ✅ 新增：给角色分配菜单 ============
    public async Task<bool> AssignMenusToRoleAsync(int roleId, List<int> menuIds)
    {
        // 1. 检查角色是否存在，不存在直接返回 false（由 Controller 返回 404）
        var roleExists = await _context.Roles.AnyAsync(r => r.Id == roleId);
        if (!roleExists) return false;

        // 2. 开启事务
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 3. 删除该角色原有的菜单关联
            var existingMenus = await _context.RoleMenus
                .Where(rm => rm.RoleId == roleId)
                .ToListAsync();
            _context.RoleMenus.RemoveRange(existingMenus);

            // 4. 插入新的关联
            if (menuIds != null && menuIds.Any())
            {
                var validMenuIds = menuIds.Distinct().ToList();
                var newRoleMenus = validMenuIds.Select(menuId => new RoleMenu
                {
                    RoleId = roleId,
                    MenuId = menuId
                });

                await _context.RoleMenus.AddRangeAsync(newRoleMenus);
            }

            // 5. 保存并提交
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw; // 向上抛出，让全局异常处理捕获
        }
    }
}