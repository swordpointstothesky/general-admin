using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class DictService : IDictService
{
    private readonly AppDbContext _context;

    public DictService(AppDbContext context)
    {
        _context = context;
    }

    // ================================================================
    //  树形接口
    // ================================================================
    public async Task<List<DictTreeNodeDto>> GetDictTreeAsync()
    {
        // 1. 加载所有激活的菜单
        var menus = await _context.Menus
            .Where(m => m.IsActive)
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        // 2. 加载所有字典（含项数）
        var dicts = await _context.DictTypes
            .Include(d => d.Items)
            .OrderBy(d => d.Id)
            .ToListAsync();

        // 3. 按 MenuId 分组
        var dictsByMenu = dicts
            .Where(d => d.MenuId.HasValue)
            .GroupBy(d => d.MenuId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 4. 递归构建菜单树（只保留自己或后代有字典的菜单）
        var tree = BuildMenuTree(menus, null, dictsByMenu, out _);

        // 5. 添加"通用字典"分组
        var commonDicts = dicts.Where(d => !d.MenuId.HasValue).ToList();
        if (commonDicts.Count > 0)
        {
            tree.Add(new DictTreeNodeDto
            {
                Id = "group-common",
                Type = "group",
                Name = "通用字典",
                Children = commonDicts.Select(ToDictNode).ToList()
            });
        }

        return tree;
    }

    private List<DictTreeNodeDto> BuildMenuTree(
        List<Menu> allMenus,
        int? parentId,
        Dictionary<int, List<DictType>> dictsByMenu,
        out bool hasDict)
    {
        hasDict = false;
        var result = new List<DictTreeNodeDto>();

        var children = allMenus
            .Where(m => m.ParentId == parentId)
            .OrderBy(m => m.SortOrder)
            .ToList();

        foreach (var menu in children)
        {
            var childNodes = BuildMenuTree(allMenus, menu.Id, dictsByMenu, out var childHasDict);

            var ownDicts = dictsByMenu.TryGetValue(menu.Id, out var list)
                ? list.Select(ToDictNode).ToList()
                : new List<DictTreeNodeDto>();

            if (ownDicts.Count > 0 || childHasDict)
            {
                hasDict = true;

                var node = new DictTreeNodeDto
                {
                    Id = $"menu-{menu.Id}",
                    Type = "menu",
                    Name = menu.Name,
                    MenuId = menu.Id,
                    Children = new List<DictTreeNodeDto>()
                };

                // 字典在前，子菜单在后
                node.Children.AddRange(ownDicts);
                node.Children.AddRange(childNodes);

                result.Add(node);
            }
        }

        return result;
    }

    private DictTreeNodeDto ToDictNode(DictType d)
    {
        return new DictTreeNodeDto
        {
            Id = $"dict-{d.Id}",
            Type = "dict",
            Name = d.DisplayName,
            DictId = d.Id
        };
    }

    // ================================================================
    //  字典类型 CRUD
    // ================================================================
    public async Task<List<DictTypeDto>> GetDictTypesAsync()
    {
        return await _context.DictTypes
            .Include(d => d.Menu)
            .OrderBy(d => d.Id)
            .Select(d => new DictTypeDto
            {
                Id = d.Id,
                Name = d.Name,
                DisplayName = d.DisplayName,
                Description = d.Description,
                MenuId = d.MenuId,
                MenuName = d.Menu != null ? d.Menu.Name : null,
                IsActive = d.IsActive,
                CreateTime = d.CreateTime,
                ItemCount = d.Items.Count
            })
            .ToListAsync();
    }

    public async Task<DictTypeDto?> GetDictTypeByIdAsync(int id)
    {
        return await _context.DictTypes
            .Include(d => d.Menu)
            .Where(d => d.Id == id)
            .Select(d => new DictTypeDto
            {
                Id = d.Id,
                Name = d.Name,
                DisplayName = d.DisplayName,
                Description = d.Description,
                MenuId = d.MenuId,
                MenuName = d.Menu != null ? d.Menu.Name : null,
                IsActive = d.IsActive,
                CreateTime = d.CreateTime,
                ItemCount = d.Items.Count
            })
            .FirstOrDefaultAsync();
    }

    public async Task<DictTypeDto> CreateDictTypeAsync(CreateDictTypeRequest request)
    {
        if (await _context.DictTypes.AnyAsync(d => d.Name == request.Name))
            throw new InvalidOperationException("字典编码已存在");

        var type = new DictType
        {
            Name = request.Name,
            DisplayName = request.DisplayName,
            Description = request.Description,
            MenuId = request.MenuId,
            IsActive = true
        };

        _context.DictTypes.Add(type);
        await _context.SaveChangesAsync();

        return await GetDictTypeByIdAsync(type.Id)
            ?? throw new InvalidOperationException("创建失败");
    }

    public async Task<bool> UpdateDictTypeAsync(int id, UpdateDictTypeRequest request)
    {
        var type = await _context.DictTypes.FindAsync(id);
        if (type == null) return false;

        if (!string.IsNullOrEmpty(request.DisplayName))
            type.DisplayName = request.DisplayName;

        if (request.Description != null)
            type.Description = request.Description;

        if (request.IsActive.HasValue)
            type.IsActive = request.IsActive.Value;

        // 菜单归属
        if (request.MoveToCommon)
        {
            type.MenuId = null;
        }
        else if (request.MenuId.HasValue && request.MenuId.Value > 0)
        {
            type.MenuId = request.MenuId;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteDictTypeAsync(int id)
    {
        var type = await _context.DictTypes.FindAsync(id);
        if (type == null) return false;

        _context.DictTypes.Remove(type);
        await _context.SaveChangesAsync();
        return true;
    }

    // ================================================================
    //  字典项 CRUD
    // ================================================================
    public async Task<List<DictItemDto>> GetItemsByTypeAsync(int dictTypeId)
    {
        return await _context.DictItems
            .Where(i => i.DictTypeId == dictTypeId)
            .OrderBy(i => i.SortOrder)
            .Select(i => new DictItemDto
            {
                Id = i.Id,
                DictTypeId = i.DictTypeId,
                Label = i.Label,
                Value = i.Value,
                SortOrder = i.SortOrder,
                IsDefault = i.IsDefault,
                IsActive = i.IsActive
            })
            .ToListAsync();
    }

    public async Task<List<DictItemDto>> GetItemsByTypeNameAsync(string typeName)
    {
        return await _context.DictItems
            .Where(i => i.DictType.Name == typeName && i.IsActive)
            .OrderBy(i => i.SortOrder)
            .Select(i => new DictItemDto
            {
                Id = i.Id,
                DictTypeId = i.DictTypeId,
                Label = i.Label,
                Value = i.Value,
                SortOrder = i.SortOrder,
                IsDefault = i.IsDefault,
                IsActive = i.IsActive
            })
            .ToListAsync();
    }

    public async Task<DictItemDto> CreateDictItemAsync(CreateDictItemRequest request)
    {
        var type = await _context.DictTypes.FindAsync(request.DictTypeId);
        if (type == null) throw new InvalidOperationException("字典类型不存在");

        var item = new DictItem
        {
            DictTypeId = request.DictTypeId,
            Label = request.Label,
            Value = request.Value,
            SortOrder = request.SortOrder,
            IsDefault = request.IsDefault,
            IsActive = true
        };

        _context.DictItems.Add(item);
        await _context.SaveChangesAsync();

        return new DictItemDto
        {
            Id = item.Id,
            DictTypeId = item.DictTypeId,
            Label = item.Label,
            Value = item.Value,
            SortOrder = item.SortOrder,
            IsDefault = item.IsDefault,
            IsActive = item.IsActive
        };
    }

    public async Task<bool> UpdateDictItemAsync(int id, UpdateDictItemRequest request)
    {
        var item = await _context.DictItems.FindAsync(id);
        if (item == null) return false;

        if (!string.IsNullOrEmpty(request.Label))
            item.Label = request.Label;

        if (!string.IsNullOrEmpty(request.Value))
            item.Value = request.Value;

        if (request.SortOrder.HasValue)
            item.SortOrder = request.SortOrder.Value;

        if (request.IsDefault.HasValue)
            item.IsDefault = request.IsDefault.Value;

        if (request.IsActive.HasValue)
            item.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteDictItemAsync(int id)
    {
        var item = await _context.DictItems.FindAsync(id);
        if (item == null) return false;

        _context.DictItems.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }
}