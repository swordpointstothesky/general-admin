using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.Models;
using GeneralAdmin.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();



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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// ===== 种子数据：初始化管理员账号 =====
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // 如果数据库尚未创建（比如首次运行），自动执行迁移
    dbContext.Database.Migrate();

    // 检查是否已有用户
    if (!dbContext.Users.Any())
    {
        // 创建管理员用户，密码用 BCrypt 哈希
        var adminUser = new User
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Email = "admin@example.com",
            IsActive = true,
            CreateTime = DateTime.UtcNow
        };
        dbContext.Users.Add(adminUser);
        dbContext.SaveChanges();  // 同步保存
        Console.WriteLine("✅ 已创建默认管理员账号: admin / 123456");
    }
    else
    {
        Console.WriteLine("ℹ️ 数据库已存在用户，跳过种子初始化。");
    }
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