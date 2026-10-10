using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Common;

public static class MenuSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        var definitions = MenuDefinitions.All;
        var existing = await db.Menus.ToListAsync();
        var existingPaths = existing.Select(m => m.Path).ToHashSet();

        var added = 0;
        var updated = 0;

        // 先处理顶层菜单（ParentPath == null）
        var topLevel = definitions.Where(d => d.ParentPath == null).ToList();
        foreach (var def in topLevel)
        {
            var menu = existing.FirstOrDefault(m => m.Path == def.Path);
            if (menu == null)
            {
                db.Menus.Add(new Menu
                {
                    Name = def.Name,
                    Path = def.Path,
                    Icon = def.Icon,
                    SortOrder = def.SortOrder,
                    IsActive = true,
                });
                added++;
            }
            else if (menu.Name != def.Name || menu.Icon != def.Icon || menu.SortOrder != def.SortOrder)
            {
                menu.Name = def.Name;
                menu.Icon = def.Icon;
                menu.SortOrder = def.SortOrder;
                updated++;
            }
        }
        await db.SaveChangesAsync();

        // 重新加载以获取顶层菜单的 Id
        existing = await db.Menus.ToListAsync();

        // 处理子菜单
        var children = definitions.Where(d => d.ParentPath != null).ToList();
        foreach (var def in children)
        {
            var parent = existing.FirstOrDefault(m => m.Path == def.ParentPath);
            if (parent == null) continue;

            var menu = existing.FirstOrDefault(m => m.Path == def.Path);
            if (menu == null)
            {
                db.Menus.Add(new Menu
                {
                    Name = def.Name,
                    Path = def.Path,
                    Icon = def.Icon,
                    SortOrder = def.SortOrder,
                    ParentId = parent.Id,
                    IsActive = true,
                });
                added++;
            }
            else
            {
                if (menu.Name != def.Name || menu.Icon != def.Icon || menu.SortOrder != def.SortOrder || menu.ParentId != parent.Id)
                {
                    menu.Name = def.Name;
                    menu.Icon = def.Icon;
                    menu.SortOrder = def.SortOrder;
                    menu.ParentId = parent.Id;
                    updated++;
                }
            }
        }

        if (added > 0 || updated > 0)
        {
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ 菜单同步完成：新增 {added} 个，更新 {updated} 个");
        }

        // ===== 自动给 Admin 角色分配所有菜单 =====
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole != null)
        {
            var allMenuIds = await db.Menus.Select(m => m.Id).ToListAsync();
            var adminMenuIds = await db.RoleMenus
                .Where(rm => rm.RoleId == adminRole.Id)
                .Select(rm => rm.MenuId)
                .ToListAsync();

            var missing = allMenuIds.Except(adminMenuIds).ToList();
            if (missing.Count > 0)
            {
                foreach (var menuId in missing)
                {
                    db.RoleMenus.Add(new RoleMenu
                    {
                        RoleId = adminRole.Id,
                        MenuId = menuId,
                    });
                }
                await db.SaveChangesAsync();
                Console.WriteLine($"✅ 已为 Admin 角色补充 {missing.Count} 个菜单");
            }
        }
    }
}