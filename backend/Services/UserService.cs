using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace GeneralAdmin.Backend.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> GetUsersAsync()
    {
        return await _context.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                CreateTime = u.CreateTime,
                IsActive = u.IsActive
            })
            .ToListAsync();
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            CreateTime = user.CreateTime,
            IsActive = user.IsActive
        };
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
    {
        // 检查用户名是否已存在
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            throw new InvalidOperationException("用户名已存在");

        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Email = request.Email,
            IsActive = request.IsActive ?? true,
            CreateTime = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            CreateTime = user.CreateTime,
            IsActive = user.IsActive
        };
    }

    public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        if (!string.IsNullOrEmpty(request.Username))
            user.Username = request.Username;

        if (!string.IsNullOrEmpty(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        if (!string.IsNullOrEmpty(request.Email))
            user.Email = request.Email;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}