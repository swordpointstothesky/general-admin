namespace GeneralAdmin.Backend.Common;

/// <summary>
/// 权限定义：集中管理所有权限
/// 新增权限时，只需在这里加一行
/// </summary>
public static class PermissionDefinitions
{
    public static readonly List<PermissionDefinition> All = new()
    {
        // ===== 仪表盘 =====
        new("dashboard:view", "查看仪表盘", "仪表盘"),

        // ===== 用户管理 =====
        new("user:view", "查看用户", "用户管理"),
        new("user:create", "创建用户", "用户管理"),
        new("user:edit", "编辑用户", "用户管理"),
        new("user:delete", "删除用户", "用户管理"),
        new("user:import", "导入用户", "用户管理"),
        new("user:export", "导出用户", "用户管理"),
        new("user:assign-role", "分配角色", "用户管理"),

        // ===== 角色管理 =====
        new("role:view", "查看角色", "角色管理"),
        new("role:create", "创建角色", "角色管理"),
        new("role:edit", "编辑角色", "角色管理"),
        new("role:delete", "删除角色", "角色管理"),

        // ===== 菜单管理 =====
        new("menu:view", "查看菜单", "菜单管理"),
        new("menu:create", "创建菜单", "菜单管理"),
        new("menu:edit", "编辑菜单", "菜单管理"),
        new("menu:delete", "删除菜单", "菜单管理"),

        // ===== 数据字典 =====
        new("dict:view", "查看字典", "数据字典"),
        new("dict:create", "创建字典", "数据字典"),
        new("dict:edit", "编辑字典", "数据字典"),
        new("dict:delete", "删除字典", "数据字典"),

        // ===== 操作日志 =====
        new("log:view", "查看日志", "操作日志"),
        new("log:delete", "删除日志", "操作日志"),

        // ===== 消息通知 =====
        new("notification:view", "查看通知", "消息通知"),
        new("notification:publish", "发布通知", "消息通知"),
        new("notification:delete", "删除通知", "消息通知"),

        // ===== 代码生成器 =====
        new("generator:view", "查看生成器", "代码生成器"),
        new("generator:generate", "生成代码", "代码生成器"),

        // ===== 文件管理 =====
        new("file:upload", "上传文件", "文件管理"),
        new("file:delete", "删除文件", "文件管理"),

        // ===== 站内消息 =====
        new("chat:view", "查看消息", "站内消息"),
        new("chat:send", "发送消息", "站内消息"),

        // ===== 学生管理 =====
        new("student:view", "查看学生", "学生管理"),
        new("student:create", "创建学生", "学生管理"),
        new("student:edit", "编辑学生", "学生管理"),
        new("student:delete", "删除学生", "学生管理"),
        new("student:import", "导入学生", "学生管理"),
        new("student:export", "导出学生", "学生管理"),

        // ===== 老师管理 =====
        new("teacher:view", "查看老师", "老师管理"),
        new("teacher:create", "创建老师", "老师管理"),
        new("teacher:edit", "编辑老师", "老师管理"),
        new("teacher:delete", "删除老师", "老师管理"),

        // ===== 系统设置 =====
        new("system:settings", "系统设置", "系统设置"),
    };
}

public record PermissionDefinition(string Name, string DisplayName, string Category);