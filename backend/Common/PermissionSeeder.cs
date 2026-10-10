using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Common;

/// <summary>
/// 权限同步器：程序启动时，把 PermissionDefinitions 同步到数据库
/// 幂等操作：已存在的更新，不存在的插入，多余的（可选）删除
/// </summary>
public static class PermissionSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        var definitions = PermissionDefinitions.All;
        var existing = await db.Permissions.ToListAsync();
        var existingNames = existing.Select(p => p.Name).ToHashSet();

        var added = 0;
        var updated = 0;

        foreach (var def in definitions)
        {
            var perm = existing.FirstOrDefault(p => p.Name == def.Name);
            if (perm == null)
            {
                // 新增
                db.Permissions.Add(new Permission
                {
                    Name = def.Name,
                    DisplayName = def.DisplayName,
                    Category = def.Category,
                });
                added++;
            }
            else
            {
                // 更新显示名或分类（如果变了）
                if (perm.DisplayName != def.DisplayName || perm.Category != def.Category)
                {
                    perm.DisplayName = def.DisplayName;
                    perm.Category = def.Category;
                    updated++;
                }
            }
        }

        // 可选：删除代码里已经不存在的权限（默认不删，防止误删）
        // var toDelete = existing.Where(p => !definitions.Any(d => d.Name == p.Name)).ToList();
        // db.Permissions.RemoveRange(toDelete);

        if (added > 0 || updated > 0)
        {
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ 权限同步完成：新增 {added} 个，更新 {updated} 个");
        }

        // ===== 自动给 Admin 角色分配所有权限 =====
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole != null)
        {
            var allPermIds = await db.Permissions.Select(p => p.Id).ToListAsync();
            var adminPermIds = await db.RolePermissions
                .Where(rp => rp.RoleId == adminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var missing = allPermIds.Except(adminPermIds).ToList();
            if (missing.Count > 0)
            {
                foreach (var permId in missing)
                {
                    db.RolePermissions.Add(new RolePermission
                    {
                        RoleId = adminRole.Id,
                        PermissionId = permId,
                    });
                }
                await db.SaveChangesAsync();
                Console.WriteLine($"✅ 已为 Admin 角色补充 {missing.Count} 个权限");
            }
        }
    }
}