using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.Filters;
using GeneralAdmin.Backend.Models;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Permission", policy =>
        policy.Requirements.Add(new PermissionRequirement("")));
});

builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<ILogService, LogService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IGeneratorService, GeneratorService>();
builder.Services.AddScoped<IStudentService, StudentService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// 注册过滤器（全局生效）
builder.Services.AddScoped<OperationLogFilter>();
builder.Services.AddHttpContextAccessor();

// 添加全局过滤器
builder.Services.AddControllers(options =>
{
    options.Filters.Add<OperationLogFilter>();
});

var app = builder.Build();

// ===== 种子数据：初始化管理员账号 =====
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


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.MapGet("/api/hello", () => new { Message = "Hello from .NET 10!", Timestamp = DateTime.Now });

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();