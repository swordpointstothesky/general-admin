using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.Filters;
using GeneralAdmin.Backend.Models;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Scrutor;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ========== 1. Controllers（带全局过滤器） ==========
builder.Services.AddControllers(options =>
{
    options.Filters.Add<OperationLogFilter>();
});

// ========== 2. 授权策略 ==========
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Permission", policy =>
        policy.Requirements.Add(new PermissionRequirement("")));
});

builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();

// ========== 3. 数据库 ==========
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ========== 4. JWT 认证 ==========
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// ========== 5. ✅ Service 自动注册（Scrutor） ==========
builder.Services.Scan(scan => scan
    .FromAssembliesOf(typeof(AppDbContext))
    .AddClasses(classes => classes
        .Where(t => t.Name.EndsWith("Service") && !t.IsAbstract))
    .AsMatchingInterface()
    .WithScopedLifetime());

// ========== 6. 手动注册（不走约定的服务） ==========
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<OperationLogFilter>();

// ========== 7. 注册 OpenAPI 文档生成服务 ==========
builder.Services.AddEndpointsApiExplorer();
// 注册 OpenAPI 文档生成服务，并添加 JWT 安全方案转换器
builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

// ========== 8. CORS ==========
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// ========== 种子数据 ==========
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // 1. 初始化角色
    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { Name = "Admin", Description = "系统管理员，拥有所有权限" },
            new Role { Name = "User", Description = "普通用户，只有查看权限" }
        );
        db.SaveChanges();
    }

    // 2. 初始化权限
    if (!db.Permissions.Any())
    {
        db.Permissions.AddRange(
            new Permission { Name = "dashboard:view", DisplayName = "查看仪表盘", Category = "仪表盘" },
            new Permission { Name = "user:view", DisplayName = "查看用户", Category = "用户管理" },
            new Permission { Name = "user:create", DisplayName = "创建用户", Category = "用户管理" },
            new Permission { Name = "user:edit", DisplayName = "编辑用户", Category = "用户管理" },
            new Permission { Name = "user:delete", DisplayName = "删除用户", Category = "用户管理" },
            new Permission { Name = "role:view", DisplayName = "查看角色", Category = "角色管理" },
            new Permission { Name = "role:create", DisplayName = "创建角色", Category = "角色管理" },
            new Permission { Name = "role:edit", DisplayName = "编辑角色", Category = "角色管理" },
            new Permission { Name = "role:delete", DisplayName = "删除角色", Category = "角色管理" }
        );
        db.SaveChanges();
    }

    // 3. Admin 角色拥有所有权限
    var adminRole = db.Roles.First(r => r.Name == "Admin");
    if (!db.RolePermissions.Any(rp => rp.RoleId == adminRole.Id))
    {
        var allPerms = db.Permissions.ToList();
        foreach (var perm in allPerms)
        {
            db.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = perm.Id });
        }
        db.SaveChanges();
    }

    // 4. 初始化菜单
    if (!db.Menus.Any())
    {
        db.Menus.AddRange(
            new Menu { Name = "仪表盘", Path = "/dashboard", Icon = "LayoutDashboard", SortOrder = 1 },
            new Menu { Name = "用户管理", Path = "/users", Icon = "Users", SortOrder = 2 },
            new Menu { Name = "角色管理", Path = "/roles", Icon = "Shield", SortOrder = 3 },
            new Menu { Name = "操作日志", Path = "/logs", Icon = "FileText", SortOrder = 4 }
        );
        db.SaveChanges();
    }

    // 5. Admin 角色拥有所有菜单
    if (!db.RoleMenus.Any(rm => rm.RoleId == adminRole.Id))
    {
        var allMenus = db.Menus.ToList();
        foreach (var menu in allMenus)
        {
            db.RoleMenus.Add(new RoleMenu { RoleId = adminRole.Id, MenuId = menu.Id });
        }
        db.SaveChanges();
    }

    // 6. 创建 admin 用户
    if (!db.Users.Any(u => u.Username == "admin"))
    {
        var adminUser = new User
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Email = "admin@example.com",
            IsActive = true
        };
        db.Users.Add(adminUser);
        db.SaveChanges();

        db.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
        db.SaveChanges();
    }

    Console.WriteLine("✅ 种子数据初始化完成");
}

// ========== 中间件 在开发环境中启用 OpenAPI 和 Scalar UI ==========
if (app.Environment.IsDevelopment())
{
    // 提供 OpenAPI JSON 文档，默认路径为 /openapi/v1.json
    app.MapOpenApi();

    // 映射 Scalar UI，默认访问路径为 /scalar/v1
    app.MapScalarApiReference();
}

app.UseCors("AllowAll");
app.UseStaticFiles();
app.MapGet("/api/hello", () => new { Message = "Hello from .NET 10!", Timestamp = DateTime.Now });

app.UseHttpsRedirection();
app.UseAuthentication();   // ⚠️ 这个别漏了，顺序要在 UseAuthorization 之前
app.UseAuthorization();
app.MapControllers();

app.Run();