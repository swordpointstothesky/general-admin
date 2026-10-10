namespace GeneralAdmin.Backend.Common;

public static class MenuDefinitions
{
    public static readonly List<MenuDefinition> All = new()
    {
        // ===== 顶层菜单 =====
        new("仪表盘", "/dashboard", "LayoutDashboard", 1, null),
        new("系统管理", "/system", "Settings", 2, null),
        new("开发工具", "/dev", "Code", 3, null),
        new("日志管理", "/log", "FileText", 4, null),
        new("业务管理", "/business", "Briefcase", 5, null),

        // ===== 仪表盘子菜单 =====
        new("监控页", "/dashboard/monitor", "Activity", 1, "/dashboard"),
        new("工作台", "/dashboard/workplace", "Briefcase", 2, "/dashboard"),

        // ===== 系统管理子菜单 =====
        new("用户管理", "/users", "Users", 1, "/system"),
        new("角色管理", "/roles", "Shield", 2, "/system"),
        new("数据字典", "/dict", "BookOpen", 3, "/system"),
        new("消息通知", "/notifications", "Bell", 4, "/system"),
        new("站内消息", "/chat", "MessageCircle", 5, "/system"),

        // ===== 开发工具子菜单 =====
        new("代码生成器", "/generator", "Code", 1, "/dev"),

        // ===== 日志管理子菜单 =====
        new("操作日志", "/logs", "FileText", 1, "/log"),

        // ===== 业务管理子菜单 =====
        new("学生管理", "/students", "GraduationCap", 1, "/business"),
        new("老师管理", "/teachers", "UserCog", 2, "/business"),
    };
}

public record MenuDefinition(
    string Name,
    string Path,
    string? Icon,
    int SortOrder,
    string? ParentPath   // 用父菜单的 Path 关联，比 Id 更稳定
);